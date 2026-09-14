require 'net/http'
require 'uri'
require 'json'
require 'digest'

module DarkAuth
  class Client
    attr_reader :app_id, :secret, :version, :api_url, :session_token, :hwid

    def initialize(app_id, secret, api_url, version = '1.0.0')
      @app_id = app_id
      @secret = secret
      @version = version
      @api_url = api_url.chomp('/')
      @session_token = nil
      @hwid = generate_hwid
    end

    def generate_hwid
      raw = "#{`hostname`.strip rescue 'ruby'}:#{RUBY_PLATFORM}:#{RUBY_VERSION}"
      Digest::SHA256.hexdigest(raw)
    end

    def post(endpoint, data)
      uri = URI.parse("#{@api_url}/#{endpoint.sub(/^\//, '')}")
      header = { 'Content-Type': 'application/json' }
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == 'https')

      request = Net::HTTP::Post.new(uri.request_uri, header)
      request.body = data.to_json

      response = http.request(request)
      res = JSON.parse(response.body)

      unless res['success']
        raise "[#{res['code'] || 'ERROR'}] #{res['message'] || 'Request failed'}"
      end

      res
    end

    def init(hash = nil)
      res = post('/init', {
        app_id: @app_id,
        secret: @secret,
        version: @version,
        hash: hash
      })
      @session_token = res['session_token']
      res
    end

    def license(key)
      init unless @session_token
      post('/license', {
        session_token: @session_token,
        key: key.strip,
        hwid: @hwid
      })
    end

    def login(username, password)
      init unless @session_token
      post('/login', {
        session_token: @session_token,
        username: username,
        password: password,
        hwid: @hwid
      })
    end

    def get_var(name)
      res = post('/var/get', {
        session_token: @session_token,
        name: name
      })
      res['value']
    end
  end
end
