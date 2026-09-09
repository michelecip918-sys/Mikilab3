#!/usr/bin/perl
# Rinomina coordinata BakoMix/MohaLab/Mohammed -> Mike Mix (entita' operativa)
# Applica lo STESSO set a frontend e backend cosi' gli endpoint restano allineati.
use strict;
use warnings;

local $/;
my $file = $ARGV[0];
open(my $fh, '<', $file) or die "no $file";
my $s = <$fh>;
close($fh);

# --- Identificatori composti / componenti (specifici prima) ---
$s =~ s/BakoMixSense/MikeMixSense/g;
$s =~ s/BakemixHardware/MikeMixHardware/g;
$s =~ s/BakemixGuide/MikeMixGuide/g;
$s =~ s/Bakemix/MikeMix/g;
$s =~ s/AmbientBako/AmbientMike/g;
$s =~ s/BakoInfo/MikeInfo/g;
$s =~ s/BakoSuggestions/MikeSuggestions/g;
$s =~ s/bakoApi/mikeApi/g;

# --- Display name (stringhe) ---
$s =~ s/BakoMix/Mike Mix/g;

# --- chiavi/id/paths minuscoli ---
$s =~ s/bakomix/mikemix/g;
$s =~ s/bako_/mike_/g;
$s =~ s/\bbako\b/mike/g;
$s =~ s/Bako/Mike/g;

# --- Moha / Mohamed / Mohammed ---
$s =~ s/MohaLabFloor/MikeMixFloor/g;
$s =~ s/MohamedFloor/MikeMixFloor/g;
$s =~ s/sendToMohaLab/sendToMikeMix/g;
$s =~ s/MohammedAssistant/MikeMixAssistant/g;
$s =~ s/avatar_mohamed/avatar_mikemix/g;
$s =~ s/mikilab_mohammed_sid/mikilab_mikemix_sid/g;
$s =~ s/mohammed_chat/mikemix_chat/g;
$s =~ s/mohammed_history/mikemix_history/g;
$s =~ s/mohammadreza/mikemix/g;
$s =~ s/MohaLab/Mike Mix/g;
$s =~ s/Mohammed/Mike Mix/g;
$s =~ s/Mohamed/Mike Mix/g;
$s =~ s/mohammed/mikemix/g;
$s =~ s/mohamed/mikemix/g;

open(my $out, '>', $file) or die "cannot write $file";
print $out $s;
close($out);
