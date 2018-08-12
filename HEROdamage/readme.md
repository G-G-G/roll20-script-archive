# HeroDamage

---

Dice Rolls must start with
**!herodc [[a valid roll]]**

so for instance: !herodc [[4d6]]

There are a bunch of parameters, which must be in one of these form:
parameter:value
parameter|value

## Parameters:
### damagetype
Alternate: **type**
Values: **killing, martial, stun, normal, k, m, s, n**
As shown, can just use the first letter of each. 
Example: **!herodc [[2d6+1]]] type:k**

If no Type is supplied, it is a normal attack.
* Killing: roll is for body damage, a multiple is applied for stun. Knockback gains +1 die.
* Martial: as normal damage, but knockback gains 1 extra die.
* Stun: no body or knockback is inflicted
---

### knockback
Alternate: **kb**
By default, attacks get 2 dice of knockback. use this parameter to add extra or fewer dice.
Example: **!herodc [[9d6]] kb|-1**
Note: Martial and Killing attacks get +1 KB automatically; this is included, you dont need to add extra.
Assuming a normal attack, kb:1 would roll 3 dice, kb|-2 would roll 0 dice.
---

### knockdown
Alt: **kd**
HERO system has two different knockback systems. If this parameter is false, or omitted, the standard knockback rules are used. if kd:true, the alternate knockdown rules are used. 
False is default.
examples: **!herodc [[2d6+2]] type:k kd:true**, **!herodc [[7d6]] knockdown:true**
---

### stunmod
Alt: **stunx**, **sm**
Some killing attacks do more stun, and have a bonus to the stun multiplier. That's what this is for,
Examples: **!herodc [[1d6+1]] type|k stunx|1**, **!herodc [[2d6]] type:k sm:2**
---

### stund3
alt: **hero6e**
If using hero 6e, killing attacks roll 1d3 stun multipliers instead of d6-1. if omitted, or false, the 5e and earlier rules will be used.
Examples: stund3:true, StunD3|true, Hero6e:true, etc

### location
Alternate: **loc**, **hit**, **placed**
If this parameter is present, Hero System hit locations will be used. If omitted, standard damage is used. 
* **roll:** will make a standard 3d6 roll
* **headshot**, **highshot**, **bodyshot**, **lowshot**, **legshot**: each use the relevant location rolls (headshot is 1d6+3, for example)
* **headroll**, **highroll**, **bodyroll**, **lowroll**, **legroll**: these are simply alternate labels for the previous rolls.
* **head**, **hand**, **arm**, **shoulder**, **chest**, **stomach**, **vitals**, **thigh**, **leg**, **foot**. The hit iwll be to the specific named location. Note all but vitals use the singular term.

If the**location** parameter exists, but the value is not one of the above, a standard 3d6 roll will be made, allowing you to use **loc:any**, **loc:general**, etc. for a standard roll.

**Examples**
* !heroDC [[5d6]] loc:chest
* !heroDC [[1d6+1]] type:k sm:1 placed:head
* !heroDC [[7d6]] type:m hit:highshot
* !heroDC [[4d6]] location:any
---

### skipside
Alternate: **skip**, **side**
This is ignored if not using hit locations. When appropriate, the script will report right or left. So if you get a hit in the hand, it might report Right Hand. If skip:true, this behaviour is suppressed, and no side will be reported.
when using hit locations, if this is omitted or false, it will roll for a left / right side.
This is a pretty marginal parameter, but if in game you have aimed for the target's right leg, it might break your immersion slightly when it reports a hit in the left leg. 
---
##More Examples:
!herodc [[12d6]]
a 12d6 normal attack
!herodc [[2d6+2]] type:k
a 2d6+2 killing attack
!herodc [[7d6]] type:s hit:head
a 7d6 stun only attack that hits the head
!herodc [[6d6]] type|k loc|headshot kb|-1
6d6 killing attack, that will roll 1d6+3 for location, and roll 1 die less for knockback (cancelling the usual +1 for killing attacks)
!herodc [[4d6]] type|k stund3:true stunx:2
a 4d6 killing attack, that rolls d3 for stun, and adds a +2 modifier to the stun multiplier
!herodc [[7d6]] type:n loc|roll kd:true
a 7d6 normal attack, using the knockdown system instead of knockback, that will roll a random location for the hit.

##Credits and script
Mark L's work over in this thread (https://app.roll20.net/forum/post/5933940/help-or-support-with-a-custom-d6-dice-roller-for-the-hero-system/?pageforid=6009798) was a great inspiration (and the pretty css layout was Scott's work, thank's Scott!), and The Aaron's dice scripts provided some important code snippets.
