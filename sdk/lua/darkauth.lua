--[[
    DARK-AUTH Official Lua SDK
    Compatible with FiveM, Roblox, and Standalone Lua (luasocket/curl).
]]

local DarkAuth = {}
DarkAuth.__index = DarkAuth

function DarkAuth.new(appId, secret, version, apiUrl)
    local self = setmetatable({}, DarkAuth)
    self.appId = appId
    self.secret = secret
    self.version = version or "1.0.0"
    self.apiUrl = (apiUrl or ""):gsub("/+$", "")
    self.sessionToken = nil
    self.hwid = "LUA_CLIENT_HWID_" .. tostring(os.time())
    return self
end

function DarkAuth:httpPost(endpoint, data)
    -- In FiveM environment:
    if PerformHttpRequest then
        local p = promise.new()
        PerformHttpRequest(self.apiUrl .. "/" .. endpoint:gsub("^/+", ""), function(statusCode, responseText, headers)
            p:resolve({ status = statusCode, body = json.decode(responseText) })
        end, "POST", json.encode(data), { ["Content-Type"] = "application/json" })
        local res = Citizen.Await(p)
        return res.body
    end

    -- In Roblox environment:
    if game and game:GetService("HttpService") then
        local http = game:GetService("HttpService")
        local response = http:PostAsync(
            self.apiUrl .. "/" .. endpoint:gsub("^/+", ""),
            http:JSONEncode(data),
            Enum.HttpContentType.ApplicationJson
        )
        return http:JSONDecode(response)
    end

    -- Fallback via OS curl command (standalone Lua)
    local jsonStr = "{"
    local first = true
    for k, v in pairs(data) do
        if not first then jsonStr = jsonStr .. "," end
        jsonStr = jsonStr .. string.format('"%s":"%s"', k, tostring(v))
        first = false
    end
    jsonStr = jsonStr .. "}"

    local cmd = string.format('curl -s -X POST "%s/%s" -H "Content-Type: application/json" -d \'%s\'',
        self.apiUrl, endpoint:gsub("^/+", ""), jsonStr)
    local handle = io.popen(cmd)
    local result = handle:read("*a")
    handle:close()

    -- Simple token/value extraction
    local sessionToken = result:match('"session_token":"([^"]+)"')
    local success = result:find('"success":true') ~= nil
    local val = result:match('"value":"([^"]+)"')

    return {
        success = success,
        session_token = sessionToken,
        value = val,
        raw = result
    }
end

function DarkAuth:init()
    local res = self:httpPost("/init", {
        app_id = self.appId,
        secret = self.secret,
        version = self.version
    })
    if res.success then
        self.sessionToken = res.session_token
    end
    return res
end

function DarkAuth:license(key)
    if not self.sessionToken then self:init() end
    return self:httpPost("/license", {
        session_token = self.sessionToken,
        key = key,
        hwid = self.hwid
    })
end

function DarkAuth:getVar(name)
    local res = self:httpPost("/var/get", {
        session_token = self.sessionToken,
        name = name
    })
    return res.value
end

return DarkAuth
