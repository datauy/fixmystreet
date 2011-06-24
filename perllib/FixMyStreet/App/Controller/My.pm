package FixMyStreet::App::Controller::My;
use Moose;
use namespace::autoclean;

BEGIN { extends 'Catalyst::Controller'; }

=head1 NAME

FixMyStreet::App::Controller::My - Catalyst Controller

=head1 DESCRIPTION

Catalyst Controller.

=head1 METHODS

=cut

=head2 index

=cut

sub my : Path : Args(0) {
    my ( $self, $c ) = @_;

    $c->detach( '/auth/redirect' ) unless $c->user;

    my $pins = [];
    my $problems = {};
    foreach my $problem ( $c->user->problems ) {
        push @$pins, {
            latitude  => $problem->latitude,
            longitude => $problem->longitude,
            colour    => $problem->state eq 'fixed' ? 'green' : 'red',
            id        => $problem->id,
            title     => $problem->title,
        };
        push @{ $problems->{$problem->state} }, $problem;
    }

    $c->stash->{problems} = $problems;

    FixMyStreet::Map::display_map(
        $c,
        latitude  => $pins->[0]{latitude},
        longitude => $pins->[0]{longitude},
        pins      => $pins,
        any_zoom  => 1,
    )
        if @$pins;
}

__PACKAGE__->meta->make_immutable;

1;
