# Star Wars Lightsabers modding.

This document describes how you can mod the [Star Wars Lightsabers](http://steamcommunity.com/sharedfiles/filedetails/?id=111412589 "Star Wars Lightsabers Workshop Page") Garry's Mod addon.

Note that I will not provide help if you do not know what you are doing ( i.e. You do not know how to program )

I will also not provide any help with extracted version of this mod ( or any other mod ), nor I will help you with editing the mod.

You may not upload edited or not version of this mod anywhere. You may upload self contained addons that use the APIs below.

## Tool Modding

How to add new stuff to the Sandbox tool. All of the code in this section **must** be called shared - both on client and server.

### Adding models for the tool
```
list.Set( "LightsaberModels", "<pathToModel>", {} )
```
```<pathToModel>``` is your path to the model file.
Must start with ```models/``` and end with ```.mdl```, for example ```models/weapons/stuff.mdl```.

### Adding a set of ignition sounds for the tool
```
list.Set( "rb655_LightsaberIgniteSounds", "#myCustomUniqueInternalName", {
	rb655_lightsaber_onsound = "<pathToOnSound>",
	rb655_lightsaber_offsound = "<pathToOffSound>"
} )
```
```<pathToOnSound>``` is your path to the sound file for the Ignition sound.
Must **NOT** start with ```sound/```, for example ```lightsabers/myOnSound1.wav```.

```<pathToOffSound>``` is the same as above, but for the Extinguish sound.

```#myCustomUniqueInternalName``` is your internal name for the sound, that will appear in the tool UI. You should translate it to a real/proper name with [```language.Add( "#myCustomUniqueInternalName", "My Custom Sound" )```](http://wiki.garrysmod.com/page/language/Add).

File format **MUST** be compatible with Garry's Mod, so either ```.wav``` or ```.mp3``` will do. Recommended format is ```.wav```.

### Adding swing sounds
```
list.Set( "rb655_LightsaberSwingSounds", "#myCustomUniqueInternalName", {
	rb655_lightsaber_swingsound = "<pathToSwingSound>"
} )
```

```<pathToSwingSound>``` is your path to the **looping** sound file for swings. Rules from above apply.

Learn how to make looping ```.wav``` files **[here](http://wiki.garrysmod.com/page/Creating_Looping_Sounds)**.

### Adding hum sounds
```
list.Set( "rb655_LightsaberHumSounds", "#myCustomUniqueInternalName", {
	rb655_lightsaber_humsound = "<pathToHumSound>"
} )
```

```<pathToHumSound>``` is your path to the **looping** sound file for idle hum. Rules from above apply.

## Weapon & Entity Modding

This section describes ways you can affect the Weapon and Entity of the mod.

### Custom damage for lightsaber ( Weapon and Entity, Serverside )
```
hook.Add( "CanLightsaberDamageEntity", "my_unqiue_hook_name_here", function( victim, lightsaber, trace )
	return 50 -- Makes the damage twice as high for the weapon
end )
```

### Preventing force power usage ( Weapon, Shared )
```
GM:CanUseLightsaberForcePower( Entity owner, string power ) - return false to disallow owner to use and hide given Force Power from UI
```

Serverside, prevents usage of said force power, clientside, hides the Force Power from the HUD.

Examples:
```
-- Prevents everyone from using any force powers
hook.Add( "CanUseLightsaberForcePower", "my_unqiue_hook_name_here", function( ply, power )
	return false
end )
```
```
-- Prevents NON ADMINS from using any force powers
hook.Add( "CanUseLightsaberForcePower", "my_unqiue_hook_name_here", function( ply, power )
	if ( !ply:IsAdmin() ) then return false end
end )
```
```
-- Prevents everyone from using Force Combust
hook.Add( "CanUseLightsaberForcePower", "my_unqiue_hook_name_here", function( ply, power )
	if ( power == "Force Combust" ) then return false end
end )
```

List of current Force Powers:
```
"Force Leap"
"Force Absorb"
"Force Repulse"
"Force Heal"
"Force Combust"
"Force Lightning"
```

### Spawning the weapon and giving it custom colors, etc ( Serverside )
```
local ply = Entity( 1 ) -- This is your player object

local wep = ply:Give( "weapon_lightsaber" )
if ( !IsValid( wep ) ) then return end -- The player already has the weapon

wep.WeaponSynched = true -- Prevent the weapon from loading settings from the Sandbox tool

wep:SetMaxLength( 420 ) -- Blade length
wep:SetCrystalColor( Vector( 255, 0, 0 ) ) -- Blade color - must be a Vector, not a Color
wep:SetDarkInner( false ) -- Whether the blade inner part is dark or not
wep:SetWorldModel( "models/sgg/starwars/weapons/w_anakin_ep2_saber_hilt.mdl" ) -- The full model path
wep:SetBladeWidth( 20 ) -- Blade width
wep:WorksUnderwater( false ) -- Default = true, if set to false, will auto disable upon entering water

wep.LoopSound = "lightsaber/saber_loop" .. math.random( 1, 8 ) .. ".wav" -- Hum sound, full paths
wep.SwingSound = "lightsaber/saber_swing" .. math.random( 1, 2 ) .. ".wav" -- Swing sound
wep:SetOnSound( "lightsaber/saber_on" .. math.random( 1, 4 ) .. ".wav" ) -- On sound
wep:SetOffSound( "lightsaber/saber_off" .. math.random( 1, 4 ) .. ".wav" ) -- Off sound

-- These are optional
wep:SetForceType( 1 ) -- Starting Force Type - 1 to 6
wep:SetForce( 100 ) -- Starting Amount of Force. Will autoregen to 100.
```

## Creating Lightsaber models

* Your models MUST have a bone named ```ValveBiped.Bip01_R_Hand``` to act as a weapon model. ( So it attaches to your hand )
* Your models MUST have attachments for each blade:
 * blade1
 * blade2
 * blade3 - etc, format for normal blades
* Your models MUST have attachments for each quillon ( Kylo Ren like sideguards ):
 * quillon1
 * quillon2
 * quillon3 - etc, format for Kylo Ren-like crossguard blades.

## Console variables

Console Variable | Default | Realm | Info
------------ | ------------- | ------------- | -------------
```rb655_lightsaber_hiltonbelt``` ```1/0```|1|Server|Show the Lightsaber hilt on player models belt if you holster your Lightsaber
```rb655_lightsaber_hud_blur``` ```1/0```|0|Client|Enables the fancy blur effect on the Lightsaber SWEP HUD. It **will** kill your FPS
```rb655_lightsaber_infinite``` ```1/0```|0|Server|Enables infinite Force
```sbox_maxent_lightsabers``` ```<number>```|2|Server|Server Lightsaber Entity limit
```rb655_lightsaber_allow_knockback``` ```1/0```|1|Server|Allow Lightsaber SWEP to knock players back when they are damaged by it
