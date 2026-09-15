# frozen_string_literal: true

# DARK-AUTH Official Ruby SDK v2.0.0
#
# Client library for the DARK-AUTH V2 API.
# Supports: Init, License Auth, User Login/Register, Cloud Variables, Chat, Logging, HWID lock.

require 'net/http'
require 'uri'
require 'json'
require 'digest'
require 'timeout'

module DarkAuth
  SDK_VERSION = "2.0.0"

  class Client
    attr_reader :app_id, :secret, :version, :api_url, :session_token, :hwid, :user, :license_info

    def initialize(app_id:, secret:, api_url:, version: SDK_VERSION)
      @app_id = app_id
      @secret = secret
      @version = version
      @api_url = api_url.chomp('/')
      @session_token = nil
      @hwid = generate_hwid
      @user = nil
      @license_info = nil
    end

    # Generate a hardware fingerprint from system information.
    def generate_hwid
      hostname = (`hostname`.strip rescue 'unknown')
      platform = RUBY_PLATFORM
      ruby_ver = RUBY_VERSION
      raw = "#{hostname}:#{platform}:#{ruby_ver}:#{Process.pid}"
      Digest::SHA256.hexdigest(raw)
    end

    # Compute SHA-256 hash of a file.
    def self.compute_file_hash(file_path)
      Digest::SHA256.hexdigest(File.binread(file_path))
    end

    # Build the full URL for an API v2 endpoint.
    def url(endpoint)
      "#{@api_url}/api/v2/#{endpoint.sub(%r{^/+}, '')}"
    end

    # Send a POST request to the API.
    def post(endpoint, data)
      uri = URI.parse(url(endpoint))
      header = { 'Content-Type' => 'application/json' }
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == 'https')
      http.open_timeout = 15
      http.read_timeout = 15

      request = Net::HTTP::Post.new(uri.request_uri, header)
      request.body = data.to_json

      response = http.request(request)
      res = JSON.parse(response.body)

      unless res['success']
        code = res['code'] || 'ERROR'
        msg = res['message'] || 'Request failed'
        raise "[#{code}] #{msg}"
      end

      res
    rescue JSON::ParserError => e
      raise "JSON parse error: #{e.message}"
    rescue Timeout::Error
      raise "Request timed out"
    rescue StandardError => e
      raise "HTTP error: #{e.message}"
    end

    # Send a GET request to the API.
    def get(endpoint, params)
      uri = URI.parse(url(endpoint))
      uri.query = URI.encode_www_form(params)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == 'https')
      http.open_timeout = 15
      http.read_timeout = 15

      request = Net::HTTP::Get.new(uri)
      response = http.request(request)
      JSON.parse(response.body)
    rescue JSON::ParserError => e
      raise "JSON parse error: #{e.message}"
    end

    # Ensure a session token exists.
    def ensure_session
      init unless @session_token
    end

    # Initialize a session with the DARK-AUTH API.
    def init(hash: nil)
      payload = {
        app_id: @app_id,
        secret: @secret,
        version: @version
      }
      payload[:hash] = hash if hash

      res = post('/init', payload)
      @session_token = res['session_token']
      res
    end

    # Authenticate with a license key.
    def license(key)
      ensure_session
      res = post('/license', {
        session_token: @session_token,
        key: key.strip,
        hwid: @hwid
      })
      @license_info = res
      @user = res['user']
      res
    end

    # Log in with username and password.
    def login(username, password)
      ensure_session
      res = post('/login', {
        session_token: @session_token,
        username: username,
        password: password,
        hwid: @hwid
      })
      @user = res['user']
      res
    end

    # Register a new account with a license key.
    def register(username, password, key)
      ensure_session
      res = post('/register', {
        session_token: @session_token,
        username: username,
        password: password,
        key: key.strip,
        hwid: @hwid
      })
      @user = res['user']
      res
    end

    # Check if the current session is still valid.
    def check
      return false unless @session_token

      begin
        res = post('/check', { session_token: @session_token })
        res['success'] == true
      rescue StandardError
        false
      end
    end

    # Get a cloud variable value.
    def get_var(name)
      ensure_session
      res = post('/var/get', {
        session_token: @session_token,
        name: name
      })
      res['value']
    end

    # Set a cloud variable value.
    def set_var(name, value)
      ensure_session
      post('/var/set', {
        session_token: @session_token,
        name: name,
        value: value.to_s
      })
    end

    # Send a log entry to the API.
    def log(message, level: 'INFO')
      ensure_session
      post('/log', {
        session_token: @session_token,
        message: message,
        level: level
      })
    end

    # Request a HWID reset for a key.
    def reset_hwid(key)
      ensure_session
      post('/hwid/reset', {
        session_token: @session_token,
        key: key
      })
    end

    # Get chat messages from a channel.
    def get_chat(channel: 'general')
      ensure_session
      res = get('/chat', {
        session_token: @session_token,
        channel: channel
      })
      res['messages'] || []
    end

    # Send a chat message.
    def send_chat(sender, message, channel: 'general')
      ensure_session
      post('/chat', {
        session_token: @session_token,
        channel: channel,
        sender: sender,
        message: message
      })
    end
  end
end
