--[[
    DARK-AUTH Official Lua SDK v2.0.0
    Compatible with FiveM, Roblox, and Standalone Lua (luasocket/curl).
]]

local DarkAuth = {}
DarkAuth.__index = DarkAuth

local SDK_VERSION = "2.0.0"

function DarkAuth.new(appId, secret, apiUrl, version)
    local self = setmetatable({}, DarkAuth)
    self.appId = appId
    self.secret = secret
    self.version = version or SDK_VERSION
    self.apiUrl = (apiUrl or ""):gsub("/+$", "")
    self.sessionToken = nil
    self.hwid = self:_generateHWID()
    self.user = nil
    self.licenseInfo = nil
    return self
end

function DarkAuth:_generateHWID()
    if _G.Citizen then
        -- FiveM environment
        local identifiers = {}
        local source = GetPlayerName(PlayerId()) or "fivem"
        table.insert(identifiers, source)
        table.insert(identifiers, tostring(GetPlayerServerId(PlayerId())))
        local raw = table.concat(identifiers, ":")
        return self:_sha256(raw)
    end
    if game and game:GetService then
        -- Roblox environment
        local HttpService = game:GetService("HttpService")
        local Players = game:GetService("Players")
        local player = Players.LocalPlayer
        local raw = tostring(player and player.UserId or 0) .. ":" .. tostring(player and player.Name or "unknown")
        return self:_sha256(raw)
    end
    -- Standalone
    local hostname = ""
    if os and os.hostname then
        hostname = os.hostname()
    end
    local user = ""
    if os and os.getenv then
        user = os.getenv("USER") or os.getenv("USERNAME") or "lua"
    end
    return self:_sha256(hostname .. ":" .. user .. ":" .. tostring(os.time()))
end

function DarkAuth:_sha256(input)
    -- FiveM has Citizen.ValidateText, Roblox has crypto, standalone uses openssl
    if _G.Citizen then
        return exports["darkauth"]:sha256(input) or self:_fallbackHash(input)
    end
    if crypto and crypto.sha256 then
        return crypto.sha256(input):lower()
    end
    return self:_fallbackHash(input)
end

function DarkAuth:_fallbackHash(input)
    -- Simple fallback using MD5-like approach (not cryptographically secure)
    local hash = 0
    for i = 1, #input do
        hash = ((hash * 31) + string.byte(input, i)) % 2147483647
    end
    return string.format("%064x", hash)
end

function DarkAuth:_url(endpoint)
    return self.apiUrl .. "/api/v2/" .. endpoint:gsub("^/+", "")
end

function DarkAuth:_httpPost(endpoint, data)
    local url = self:_url(endpoint)

    -- FiveM environment
    if PerformHttpRequest then
        local p = promise.new()
        PerformHttpRequest(url, function(statusCode, responseText, headers)
            local ok, decoded = pcall(json.decode, responseText)
            if ok then
                p:resolve(decoded)
            else
                p:resolve({ success = false, message = "JSON decode failed" })
            end
        end, "POST", json.encode(data), { ["Content-Type"] = "application/json" })
        local res = Citizen.Await(p)
        return res
    end

    -- Roblox environment
    if game and game:GetService then
        local HttpService = game:GetService("HttpService")
        local success, response = pcall(function()
            return HttpService:PostAsync(url, HttpService:JSONEncode(data), Enum.HttpContentType.ApplicationJson)
        end)
        if success then
            return HttpService:JSONDecode(response)
        else
            return { success = false, message = tostring(response) }
        end
    end

    -- Standalone fallback via curl
    local jsonParts = {}
    for k, v in pairs(data) do
        table.insert(jsonParts, string.format('"%s":"%s"', tostring(k), tostring(v)))
    end
    local jsonStr = "{" .. table.concat(jsonParts, ",") .. "}"

    local cmd = string.format('curl -s -X POST "%s" -H "Content-Type: application/json" -d \'%s\'', url, jsonStr)
    local handle = io.popen(cmd)
    if not handle then
        return { success = false, message = "curl failed" }
    end
    local result = handle:read("*a")
    handle:close()

    -- Parse result manually
    local success = result:find('"success":true') ~= nil
    local sessionToken = result:match('"session_token":"([^"]+)"')
    local value = result:match('"value":"([^"]+)"')
    local message = result:match('"message":"([^"]+)"')
    local code = result:match('"code":"([^"]+)"')

    return {
        success = success,
        session_token = sessionToken,
        value = value,
        message = message,
        code = code,
        raw = result
    }
end

function DarkAuth:_httpGet(endpoint, params)
    local url = self:_url(endpoint)
    local queryString = {}
    for k, v in pairs(params) do
        table.insert(queryString, k .. "=" .. tostring(v))
    end
    if #queryString > 0 then
        url = url .. "?" .. table.concat(queryString, "&")
    end

    -- FiveM
    if PerformHttpRequest then
        local p = promise.new()
        PerformHttpRequest(url, function(statusCode, responseText)
            local ok, decoded = pcall(json.decode, responseText)
            p:resolve(ok and decoded or { success = false, message = "JSON decode failed" })
        end, "GET")
        return Citizen.Await(p)
    end

    -- Roblox
    if game and game:GetService then
        local HttpService = game:GetService("HttpService")
        local success, response = pcall(function()
            return HttpService:GetAsync(url)
        end)
        if success then
            return HttpService:JSONDecode(response)
        end
        return { success = false, message = tostring(response) }
    end

    -- Standalone
    local handle = io.popen('curl -s "' .. url .. '"')
    if not handle then return { success = false, message = "curl failed" } end
    local result = handle:read("*a")
    handle:close()

    local success = result:find('"success":true') ~= nil
    local messages = {}
    for msg in result:gmatch('"message":"([^"]*)"') do
        table.insert(messages, { message = msg })
    end
    return { success = success, messages = messages, raw = result }
end

function DarkAuth:init(hash)
    local data = {
        app_id = self.appId,
        secret = self.secret,
        version = self.version
    }
    if hash then data.hash = hash end

    local res = self:_httpPost("/init", data)
    if res.success then
        self.sessionToken = res.session_token
    end
    return res
end

function DarkAuth:license(key)
    if not self.sessionToken then self:init() end
    local res = self:_httpPost("/license", {
        session_token = self.sessionToken,
        key = key:match("^%s*(.-)%s*$"),
        hwid = self.hwid
    })
    self.licenseInfo = res
    self.user = res.user
    return res
end

function DarkAuth:login(username, password)
    if not self.sessionToken then self:init() end
    local res = self:_httpPost("/login", {
        session_token = self.sessionToken,
        username = username,
        password = password,
        hwid = self.hwid
    })
    self.user = res.user
    return res
end

function DarkAuth:register(username, password, key)
    if not self.sessionToken then self:init() end
    local res = self:_httpPost("/register", {
        session_token = self.sessionToken,
        username = username,
        password = password,
        key = key:match("^%s*(.-)%s*$"),
        hwid = self.hwid
    })
    self.user = res.user
    return res
end

function DarkAuth:check()
    if not self.sessionToken then return false end
    local res = self:_httpPost("/check", { session_token = self.sessionToken })
    return res.success == true
end

function DarkAuth:getVar(name)
    if not self.sessionToken then self:init() end
    local res = self:_httpPost("/var/get", {
        session_token = self.sessionToken,
        name = name
    })
    return res.value
end

function DarkAuth:setVar(name, value)
    if not self.sessionToken then self:init() end
    return self:_httpPost("/var/set", {
        session_token = self.sessionToken,
        name = name,
        value = tostring(value)
    })
end

function DarkAuth:log(message, level)
    if not self.sessionToken then self:init() end
    return self:_httpPost("/log", {
        session_token = self.sessionToken,
        message = message,
        level = level or "INFO"
    })
end

function DarkAuth:resetHWID(key)
    if not self.sessionToken then self:init() end
    return self:_httpPost("/hwid/reset", {
        session_token = self.sessionToken,
        key = key
    })
end

function DarkAuth:getChat(channel)
    if not self.sessionToken then self:init() end
    local res = self:_httpGet("/chat", {
        session_token = self.sessionToken,
        channel = channel or "general"
    })
    return res.messages or {}
end

function DarkAuth:sendChat(sender, message, channel)
    if not self.sessionToken then self:init() end
    return self:_httpPost("/chat", {
        session_token = self.sessionToken,
        channel = channel or "general",
        sender = sender,
        message = message
    })
end

return DarkAuth
