package DarkAuth;

# DARK-AUTH Official Perl SDK v2.0.0
#
# Client library for the DARK-AUTH V2 API.
# Supports: Init, License Auth, User Login/Register, Cloud Variables, Chat, Logging, HWID lock.

use strict;
use warnings;
use LWP::UserAgent;
use HTTP::Request;
use JSON::PP;
use Digest::SHA qw(sha256_hex);
use File::Slurp;
use Sys::Hostname;

our $VERSION = "2.0.0";

sub new {
    my ($class, %args) = @_;
    die "app_id required" unless $args{app_id};
    die "secret required" unless $args{secret};
    die "api_url required" unless $args{api_url};

    my $self = {
        app_id        => $args{app_id},
        secret        => $args{secret},
        version       => $args{version} || $VERSION,
        api_url       => $args{api_url},
        session_token => undef,
        hwid          => _generate_hwid(),
        user          => undef,
        license_info  => undef,
        ua            => LWP::UserAgent->new(timeout => 15),
    };
    $self->{api_url} =~ s/\/+$//;
    bless $self, $class;
    return $self;
}

sub _generate_hwid {
    my $hostname = eval { hostname() } || 'unknown';
    my $os       = $^O || 'unknown';
    my $user     = $ENV{USERNAME} || $ENV{USER} || 'perl';
    my $raw      = "$hostname:$os:$user:$>";
    return sha256_hex($raw);
}

sub compute_file_hash {
    my ($file_path) = @_;
    open my $fh, '<:raw', $file_path or die "Cannot open $file_path: $!";
    my $sha = Digest::SHA->new(256);
    $sha->addfile($fh);
    close $fh;
    return $sha->hexdigest;
}

sub _url {
    my ($self, $endpoint) = @_;
    $endpoint =~ s/^\/+//;
    return "$self->{api_url}/api/v2/$endpoint";
}

sub _post {
    my ($self, $endpoint, $data) = @_;
    my $url = $self->_url($endpoint);
    my $json_payload = encode_json($data);

    my $req = HTTP::Request->new('POST', $url);
    $req->header('Content-Type' => 'application/json');
    $req->content($json_payload);

    my $resp = $self->{ua}->request($req);
    unless ($resp->is_success) {
        die "HTTP Error: " . $resp->status_line . " " . $resp->decoded_content;
    }

    my $decoded = eval { decode_json($resp->decoded_content) };
    if ($@ || !$decoded || !$decoded->{success}) {
        my $msg   = $decoded->{message}   || 'Request failed';
        my $code  = $decoded->{code}      || 'ERROR';
        die "[$code] $msg\n";
    }
    return $decoded;
}

sub _get {
    my ($self, $endpoint, $params) = @_;
    my $url = $self->_url($endpoint);
    my $query_string = join('&', map { "$_=$params->{$_}" } keys %$params);
    $url .= "?$query_string" if $query_string;

    my $req = HTTP::Request->new('GET', $url);
    my $resp = $self->{ua}->request($req);
    return decode_json($resp->decoded_content) if $resp->is_success;
    return { success => 0, message => $resp->status_line };
}

sub _ensure_session {
    my ($self) = @_;
    $self->init() unless $self->{session_token};
}

sub init {
    my ($self, %args) = @_;
    my $data = {
        app_id  => $self->{app_id},
        secret  => $self->{secret},
        version => $self->{version},
    };
    $data->{hash} = $args{hash} if exists $args{hash};

    my $res = $self->_post('init', $data);
    $self->{session_token} = $res->{session_token};
    return $res;
}

sub license {
    my ($self, $key) = @_;
    $self->_ensure_session();
    my $res = $self->_post('license', {
        session_token => $self->{session_token},
        key           => $key,
        hwid          => $self->{hwid},
    });
    $self->{license_info} = $res;
    $self->{user} = $res->{user};
    return $res;
}

sub login {
    my ($self, $username, $password) = @_;
    $self->_ensure_session();
    my $res = $self->_post('login', {
        session_token => $self->{session_token},
        username      => $username,
        password      => $password,
        hwid          => $self->{hwid},
    });
    $self->{user} = $res->{user};
    return $res;
}

sub register {
    my ($self, $username, $password, $key) = @_;
    $self->_ensure_session();
    my $res = $self->_post('register', {
        session_token => $self->{session_token},
        username      => $username,
        password      => $password,
        key           => $key,
        hwid          => $self->{hwid},
    });
    $self->{user} = $res->{user};
    return $res;
}

sub check {
    my ($self) = @_;
    return 0 unless $self->{session_token};
    eval {
        my $res = $self->_post('check', { session_token => $self->{session_token} });
        return $res->{success} ? 1 : 0;
    };
    return 0;
}

sub get_var {
    my ($self, $name) = @_;
    $self->_ensure_session();
    my $res = $self->_post('var/get', {
        session_token => $self->{session_token},
        name          => $name,
    });
    return $res->{value};
}

sub set_var {
    my ($self, $name, $value) = @_;
    $self->_ensure_session();
    return $self->_post('var/set', {
        session_token => $self->{session_token},
        name          => $name,
        value         => $value,
    });
}

sub log {
    my ($self, $message, $level) = @_;
    $level //= 'INFO';
    $self->_ensure_session();
    return $self->_post('log', {
        session_token => $self->{session_token},
        message       => $message,
        level         => $level,
    });
}

sub reset_hwid {
    my ($self, $key) = @_;
    $self->_ensure_session();
    return $self->_post('hwid/reset', {
        session_token => $self->{session_token},
        key           => $key,
    });
}

sub get_chat {
    my ($self, $channel) = @_;
    $channel //= 'general';
    $self->_ensure_session();
    my $res = $self->_get('chat', {
        session_token => $self->{session_token},
        channel       => $channel,
    });
    return $res->{messages} || [];
}

sub send_chat {
    my ($self, $sender, $message, $channel) = @_;
    $channel //= 'general';
    $self->_ensure_session();
    return $self->_post('chat', {
        session_token => $self->{session_token},
        channel       => $channel,
        sender        => $sender,
        message       => $message,
    });
}

sub get_session_token { return $_[0]->{session_token}; }
sub get_hwid          { return $_[0]->{hwid}; }

1;
