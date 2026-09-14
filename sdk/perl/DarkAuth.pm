package DarkAuth;

use strict;
use warnings;
use LWP::UserAgent;
use JSON::PP;
use Digest::SHA qw(sha256_hex);

sub new {
    my ($class, %args) = @_;
    my $self = {
        app_id        => $args{app_id} || die "app_id required",
        secret        => $args{secret} || die "secret required",
        version       => $args{version} || '1.0.0',
        api_url       => $args{api_url} || die "api_url required",
        session_token => undef,
        hwid          => sha256_hex($^O . ":" . ($ENV{USERNAME} || 'perl')),
        ua            => LWP::UserAgent->new(timeout => 10),
    };
    $self->{api_url} =~ s/\/+$//;
    bless $self, $class;
    return $self;
}

sub _post {
    my ($self, $endpoint, $data) = @_;
    $endpoint =~ s/^\/+//;
    my $url = "$self->{api_url}/$endpoint";
    my $json_payload = encode_json($data);

    my $req = HTTP::Request->new('POST', $url);
    $req->header('Content-Type' => 'application/json');
    $req->content($json_payload);

    my $resp = $self->{ua}->request($req);
    my $decoded = eval { decode_json($resp->decoded_content) };

    if (!$resp->is_success || !$decoded || !$decoded->{success}) {
        my $msg = $decoded->{message} || $resp->status_line;
        die "DarkAuth Error: $msg\n";
    }
    return $decoded;
}

sub init {
    my ($self) = @_;
    my $res = $self->_post('init', {
        app_id  => $self->{app_id},
        secret  => $self->{secret},
        version => $self->{version},
    });
    $self->{session_token} = $res->{session_token};
    return $res;
}

sub license {
    my ($self, $key) = @_;
    $self->init() unless $self->{session_token};
    return $self->_post('license', {
        session_token => $self->{session_token},
        key           => $key,
        hwid          => $self->{hwid},
    });
}

sub get_var {
    my ($self, $name) = @_;
    my $res = $self->_post('var/get', {
        session_token => $self->{session_token},
        name          => $name,
    });
    return $res->{value};
}

1;
