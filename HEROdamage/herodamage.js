/*global send2Chat getSpeaker handleInput calcDamage rollLocation errInput registerEventHandlers applyLocation getLocation  getDiceCounts  */
/*
========================
HERO SYSTEM DAMAGE ROLLS
========================
https://app.roll20.net/forum/post/6009891/script-champions-slash-hero-system-damage-roller/?pageforid=6009891#post-6009891
Dice Rolls must start with
!herodc [[a valid roll]]

so for instance: !herodc [[4d6]]

There are a bunch of parameters, which must be in one of these form:
parameter:value
parameter|value

=======Parameters==========
damagetype
Alternate: type
    Values: killing, martial, stun, normal
    Can use just the first letter of each. 
    If no Type is supplied, it is a normal attack.
    Killing: roll is for body damage, a multiple is applied for stun. Knockback gains +1 die.
    Martial: as normal damage, but knockback gains 1 extra die.
    Stun: no body or knockback is inflicted

knockback
Alternate: kb
    By default, attacks get 2 dice of knockback. use this parameter to add extra or fewer dice.
    Note: Martial and Killing attacks get +1 KB automatically; this is included, you dont need to add extra.
    So, assuming a normal attack, kb:1 would roll 3 dice, kb|-2 would roll 0 dice.

knockdown
Alt: kd
    HERO system has two different knockback systems. If this parameter is false, or omitted, the standard knockback rules are used. if kd:true, the alternate knockdown rules are used. 
    False is default, so only need to include this if using knockdown..
    examples: kd:true, knockdown|true
    
stunmod
Alt: stunx, sm
    Some killing attacks do more stun, and have a bonus to the stun multiplier. That's what this is for,
    valid entries: stunx|1, sm:2, etc

stund3
alt: hero6e
    If using hero 6e, killing attacks roll 1d3 stun multipliers instead of d6-1. if omitted, or false, the 5e and earlier rules will be used.
    examples: stund3:true, StunD3|true, Hero6e:true, etc

location
Alternate: loc, hit, placed
    If this parameter is present, the location effects will be used. If omitted, standard damage is used. 
    This accepts singular locations (head, arm, shoulder, hand, vitals, chest, thigh leg, foot) as well as roll types (roll, headshot, lowroll, bodyshot, etc)
    you can also enter one of several rolls:
    roll: will make a standard 3d6 roll
    headshot, highshot, bodyshot, lowshot, legshot each use the variant location rolls (headrshot is 1d6+3 for example)
    headroll, highroll, bodyroll, lowroll, legroll are alternate values.
    Specific locations are also acceptable: head, hand, arm, shoulder, chest, stomach, vitals, thigh leg, foot. Note all but vitals use the singular term.
    If the parameter location exists, and the value is not recognised, a standard 3d6 roll will be made, allowing you to use loc:any, loc:general, and so on.
Examples 
    location:chest, placed|head, hit:highshot, loc:roll, location:any

skipside
Alternate: skip, side
    This is ignored if not using hit locations. When appropriate, the script will report right or left. So if you get a hit in the hand, it might report Right Hand. If skip:true, this behaviour is suppressed, and no side will be reported.
    when using hit locations, if this is omitted or false, it will roll for a left / right side.
    This is a pretty marginal parameter, but if in game you have aimed for the target's right leg, it might break your immersion slightly when it reports a hit in the left leg. 

====Examples======
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

*/

var herodc = herodc || (function() {
    'use strict',
    /* when given an array of numbers will return an object with the numbers as the
properties and the number of times it occurs as the value of each. */
    getDiceCounts = function(rolls) {
        return ( _.reduce(rolls || [], function(m,r){
            m[r]=(m[r]||0)+1;
            log('Parent Scope - Before call to asynchronous function.');
            return m;
        },{}));
    },
    /* takes an object with numbers as the properties and counts as the values and 
returns an array with the numbers repeated as many times as their count. */
    getDiceArray = function(c) {
        return _.reduce(c,function(m,v,k){
            _.times(v,function(){m.push(k);});
            return m;
        },[]);
    },
    
        
    getSpeaker = function(msg) {
        var characters = findObjs({_type: 'character'});
        var speaking;
        characters.forEach(function(chr) { if(chr.get('name') == msg.who) speaking = chr; });
     
        if(speaking) return 'character|'+speaking.id;
        else return'player|'+msg.playerid;
    },
    
    // update the stun and body multiples of the 
    // for killing attacks, armour applies to body before multiple
    // for normal attacks, defences apply before multiple for both stun & body
    // armour applies before multiples
    
    getLocation = function(roll) {
        let hit;
        if(roll <6) hit = 'head';
        else if(roll ===6) hit = 'hand';
        else if(roll < 9) hit = 'arm';
        else if(roll ===9) hit = 'shoulder';
        else if(roll <12) hit = 'chest';
        else if(roll === 12) hit = 'stomach';
        else if(roll === 13) hit = 'vitals';
        else if(roll === 14) hit = 'thigh';
        else if(roll < 17) hit = 'leg';
        else hit = 'foot';
        
        return hit;
    },
    
    rollLocation = function(whichRoll) {
        let roll;
        switch(whichRoll) {
            case 'headroll':
            case 'headshot': 
                roll = randomInteger(6) +3;
                break;
            case 'highroll':
            case 'highshot': 
                roll = randomInteger(6) + randomInteger(6) + 1;
                break;
            case 'bodyroll':
            case 'bodyshot':
                roll = randomInteger(6) + randomInteger(6) + 4;
                break;
            case 'lowroll':
            case 'lowshot':
                roll = Math.min(18,randomInteger(6) + randomInteger(6) + 7);
                break;
            case 'legroll':
            case 'legshot':
                roll = randomInteger(6) + 12;
                break;
            default:
                roll = randomInteger(6) + randomInteger(6) + randomInteger(6);
        }
        return roll;
    },
    
    applyLocation = function(where) {
        let locations = {
            head: { stunX: 5, NStun: 2, BodyX: 2, roll: '3-5'},
            hand: { stunX: 1, NStun: 0.5, BodyX: 0.5, roll: '6'},
            arm: { stunX: 2, NStun: 0.5, BodyX: 0.5, roll: '7-8'},
            shoulder: { stunX: 3, NStun: 1, BodyX: 1, roll: '9'},
            chest: { stunX: 3, NStun: 1, BodyX: 1, roll: '10-11'},
            stomach: { stunX: 4, NStun: 1.5, BodyX: 1, roll: '12'},
            vitals: { stunX: 4, NStun: 1.5, BodyX: 2, roll: '13'},
            thigh: { stunX: 2, NStun: 1, BodyX: 1, roll: '14'},
            leg: { stunX: 2, NStun: 0.5, BodyX: 0.5, roll: '15-16'},
            foot: { stunX: 1, NStun: 0.5, BodyX: 0.5, roll: '17-18'},
        };
        if(herodc.parameters.type === 'k') {
            herodc.damage.stunmult = locations[where]['stunX'];
            herodc.damage.bodymult = locations[where]['BodyX'];
        } else if(herodc.parameters.type === 's') {
            herodc.damage.stunmult = locations[where]['NStun'];
            herodc.damage.bodymult = 0;
        } else {
            herodc.damage.stunmult = locations[where]['NStun'];
            herodc.damage.bodymult = locations[where]['BodyX'];
        }
        herodc.damage.hitrange = locations[where]['roll'];
    },
    
    calcDamage = function(msg) {
        // rDice is an array of d6s, from the damage roll. 
        herodc.damage = { // initialise defaults for the damage output
            dice: [],  // the array that will hold the dice.
            total: 0, // initial dice roll, whether body or stun.
            body: 0,
            stun: 0,
            kb: '-',
            kblabel: 'KB: ',
            loclabel: '-',
            stunmult: 1.0,  // used on normal attacks when hit locations in use
            bodymult: 1.0,  // used for both normal and killing attacks when hit locations in use
            expression: '-',
            hitlocation: '-',
            hitroll:0,
            hitrange:'3-18',
        };
            
        herodc.damage.dice = _.pluck( (msg.inlinerolls && msg.inlinerolls[0].results.rolls[0].results) || [], 'v');
        herodc.damage.dice.sort();
        herodc.damage.dice.reverse();
        herodc.damage.total = msg.inlinerolls[0].results.total;
        herodc.damage.expression = msg.inlinerolls[0].expression;
        

        // calculate damage roll
        switch(herodc.parameters.type) {
            case 'k':
                herodc.damage.body = herodc.damage.total;
                herodc.damage.stun = herodc.damage.total * herodc.damage.stunmult;
                herodc.damage.expression += ' Killing'; 
                break;
            case 's':
                herodc.damage.stun = herodc.damage.total;
                herodc.damage.body = 0;
                herodc.damage.expression += ' Stun';
                break;
            default:
                let normal = getDiceCounts(herodc.damage.dice);
                herodc.damage.body = (normal[2] || 0)  + (normal[3] || 0) + (normal[4] || 0) + (normal[5] || 0) + ((normal[6] *2) || 0);
                herodc.damage.stun = herodc.damage.total;
                herodc.damage.expression += ' Normal';
        }
        //if(herodc.parameters.hasOwnProperty("descriptor")) 
        //    herodc.damage.expression = herodc.damage.expression + " " + herodc.parameters.descriptor;
        
        // calculate knockback
        if(herodc.parameters.knockdown) {
            // this uses the knockdown rules.
            if(herodc.parameters.type === 's') {
                herodc.damage.kb = 0;
                herodc.damage.kblabel = 'KD: ';                
            } else {
                herodc.damage.kb = herodc.damage.body * 2;
                herodc.damage.kblabel = 'KD: 1-';                
            }
        } else {
            herodc.damage.kblabel = 'KB: ';
            if(herodc.parameters.type === 's') {
                herodc.damage.kb = '-';
            } else {
                let kbDice = 2 + herodc.parameters.knockback;
                if(herodc.parameters.type === 'k' || herodc.parameters.type === 'm') kbDice +=1;
                let kb = herodc.damage.body;
                for (var i = 0; i < kbDice; i++) {
                    kb = kb - randomInteger(6);
                }
                if (kb >= 0) herodc.damage.kb = kb;
            }
        }

        // head shot 1d6+3, high shot 2d6+1 body shot 2d6+4, low show = 2d6+7, leg shot 1d6+12
        // need to apply location modifiers, and killing damage stun multiple.
        if(!herodc.parameters.uselocation) {
            if(herodc.parameters.type === 'k') {
                let stunX = 0;
                if(herodc.parameters.stund3) stunX = randomInteger(3);
                else stunX = Math.max(randomInteger(6)-1,1);
                stunX += herodc.parameters.stunmod;
                herodc.damage.stun = herodc.damage.body * stunX;
            }
        } else {
            // two possibilities: location is set, or use a location roll.
            // the logic here is tricky since location might also be a roll.
            // but location trumps locationroll.
            const rollTypes = ['headroll', 'highroll', 'bodyroll', 'lowroll', 'legroll','roll',
                'headshot', 'highshot', 'bodyshot', 'lowshot', 'legshot','shot'];
            const locations = ['head','hand','arm','shoulder','chest', 'stomach', 'vitals', 'thigh', 'leg', 'foot'];
            if(herodc.parameters.hasOwnProperty('hitlocation')) {
                if(rollTypes.indexOf(herodc.parameters.hitlocation) !== -1) {
                    herodc.damage.hitroll = rollLocation(herodc.parameters.hitlocation);
                    herodc.damage.hitlocation = getLocation(herodc.damage.hitroll);
                } else if(locations.indexOf(herodc.parameters.hitlocation) !== -1)  {
                    herodc.damage.hitlocation = herodc.parameters.hitlocation;
                } else {
                    herodc.damage.hitroll = rollLocation('roll');
                    herodc.damage.hitlocation = getLocation(herodc.damage.hitroll);
                }
            /*    
            } else {
                herodc.damage.hitlocation = getLocation(herodc.parameters.locationroll);
            */
            }
            // at this point we have a defined location.
            // when using location, add another row on the output for reporting location hit and any stun/body multiple.
            // update stun.x and bodyx
            applyLocation(herodc.damage.hitlocation);
            if(herodc.parameters.type === 'k') {
                herodc.damage.stun = herodc.damage.body * (herodc.damage.stunmult + herodc.parameters.stunmod);
            }
            log('Location: ' + herodc.damage.hitlocation);
            
        }
    }, 
    
    errInput = function(input,test) {
        let errFound = false;
        let errText = '';
        const isBoolean = (val)=>'boolean' === typeof val;
        const validLocation = [
            'head','hand','arm','shoulder','chest', 'stomach', 'vitals', 'thigh', 'leg', 'foot',
            'headroll', 'highroll', 'bodyroll', 'lowroll', 'legroll','roll','any','random',
        ];
        switch(test) {
            case 'inlineRoll':
                if(input.inlinerolls === undefined) { //msg.inlinerolls
                    errText = 'No Valid Damage Roll';
                    errFound=true;
                }
                break;
            case 'knockdown':
            case 'stund3':
            case 'skipside':
                if(isBoolean(input)) {
                    errText = 'No Valid ' + test + ' Value';
                    errFound= true;
                }
                break;
            case 'kind':
                if(input !== 'k' && input !== 'n' && input !== 'm' && input !== 's') {
                    errText = 'No Valid Damage Type';
                    errFound= true;
                }
                break;
            case 'stunmod':
            case 'knockback':
                if(isNaN(input)) {
                    errText = test + ' is not a Number';
                    errFound= true;
                }
                break;
            case 'location':
                if(validLocation.indexOf(input) === -1) {
                    errText = input + ' is not a Valid Location';
                    errFound= true;
                }
        }
        
        if(errFound) {
            sendChat('HERO DC', errText);
            return errFound;
        }
    },

    handleInput = function(msg) {

        if(msg.type === 'api' && msg.content.indexOf('!herodc') !== -1) {
            let args = msg.content.split(/\s+/);
            log('Args: ' + args.join(', '));
            herodc.parameters = {
                // initialise defaults
                type: 'n', stund3: false, stunmod: 0, uselocation: false, knockdown: false, knockback: 0
            };
            
            
            
            for(var i= 1; i < args.length; i++) {
                if(args[i].indexOf('|') > -1 || args[i].indexOf(':') > -1) {
                    let item = [];
                    if(args[i].indexOf('|') > -1) item = args[i].split('|');
                    else item = args[i].split(':');
                    log(item[0] + ': ' + item[1]);
                    // might check for valid parameters here, and discard those not used
                    if(errInput(msg,'inlineRoll')) return;

                    switch(item[0].toLowerCase()) {
                        case 'type':  // if not included, it's a normal damage roll. Can be K, N, M, S, Martial, Killing, Normal. for nnd, use StunOnly. Use first letter.
                        case 'damagetype':
                            herodc.parameters['type'] = item[1].slice(0,1).toLowerCase();
                            if(errInput(herodc.parameters.type,'kind')) return;
                            // need to check it is n, m, k, or s
                            break;
                        case 'knockdown':   // if exists, ignore knockback caclulation. KB is reported as double Body-1 (so 7 body roll = 13), using KD instead of KB.
                        case 'kd':
                            if(errInput(item[1],'knockdown')) return;
                            herodc.parameters['knockdown'] = item[1];  //should be boolean
                            break;
                        case 'knockback':   // this is KB bonus. If not included, use 2d6.
                        case 'kb':
                            if(errInput(item[1],'knockback')) return;
                            herodc.parameters['knockback'] = parseInt(item[1])||0;
                            break;
                        case 'location':    // if this exists, ignore locationroll and stun multiplier
                        case 'loc':
                        case 'hit':
                        case 'placed':
                            herodc.parameters['hitlocation'] = item[1].toLowerCase();
                            if(errInput(herodc.parameters.hitlocation,'location')) return;
                            herodc.parameters['uselocation'] = true;
                            break;
                        case 'stunmod':     // this adds to any stun multiple, whether from a roll, or 
                        case 'stunx':
                        case 'stunmodifier':
                            if(errInput(item[1],'stunmod')) return;
                            herodc.parameters['stunmod'] = parseInt(item[1])||0;
                            break;
                        case 'hero6': //true or false; if hero6, stun multiple is 1d3, not d6-1.
                        case 'stund3':
                            if(errInput(item[1],'stund3')) return;
                            herodc.parameters['stund3'] = item[1];  //should be boolean
                            break;
                        case 'side': //true or false; if true, hit location roll will NOT determine right or left. irrelevant if location rolls not used
                        case 'skipside':
                        case 'skip':
                            if(errInput(item[1],'boolean')) return;
                            herodc.parameters['skipside'] = item[1];  //should be boolean
                            break;
                            //case "descriptor":  // used for building the output title
                            //case "desc":
                            // can include error checking here to make sure item[1] is the right kind of data
                            //	herodc.parameters["descriptor"] = item[1];
                            //	break;
                        default:
                            // can i include a chat message here that the input is badly formed? add an error parameter...
                            
                    }
                }
            }
            log('Params: ' + JSON.stringify(herodc.parameters));
            calcDamage(msg);
            send2Chat(msg);
        } else {
            return;
        }
    },
    
    send2Chat = function(msg) {
        
        let css = {
            containerLeft: '<div style="width: 227px; ', containerRight: 'border: 1px solid black; padding: 1px 1px; color: black; font-weight: bold;"align=center>',
            containerM: 'background: #d8ffdb; ', containerK: 'background: #f9ffba; ', containerN: 'background: #e6f2ff;',
            diceLeft: '<div style="width: 209px; ', 
            diceRight: 'border: 1px solid #999999;border-radius: 1px;font-weight:bold;padding:5px 5px; margin:3px 3px;',
            diceEnd: '"align=center>',
            fontSize12: 'font-size: 12pt;', fontSize15: 'font-size: 15pt;',
            titleRight: 'border: 1px solid #999999;border-radius: 1px;font-weight:bold;padding:5px 5px; margin:3px 3px;font-size: 12pt"align=center>',
            diceM: 'background: #c3aa28; color: #ffffff; ', 
            diceK: 'background: #cc0000; color: #ffffff; ', 
            diceN: 'background: green; color: #ffffff; ', 
            diceS: 'background: blue; color: #ffffff; ',
            damageContainerLeft: '<div style="', damageContainerRight: 'font-weight: bold; color: black; line-height: 20px; padding-top: 1px; padding-left: 3px; padding-bottom: 3px; padding-right: 0px;" align=center>',
            damageContainerM: 'background-color: eeeeee', damageContainerK: '', damageContainerN: 'background-color: eeeeee',
            damageBoxLeft: '<div style="float: left; width: 31%; background: #f7f7f9; border: 1px solid #999999; padding: 1px 1px; ',
            damageBoxRight: 'font-weight: bold;"align=center>',
            locationBox: '<div style="float: left; width: 97%; background: #f7f7f9; border: 1px solid #999999; padding: 1px 1px; color: black; font-weight: bold;"align=center>',
            div: '<div>', divClose: '</div>', lineBreak: '<br>', divClear: '<div style="clear:both;"></div>',
            colorBlue: 'color: blue; ', colorRed: 'color: red; ', colorGreen: 'color: green; ',  
        };
        let chatString = css.div +
            css.containerLeft + css['container' + 'K'] + css.containerRight +
                css.diceLeft + css['dice' + herodc.parameters.type.toUpperCase()] + css.diceRight + css.fontSize12 + css.diceEnd + herodc.damage.expression + css.lineBreak + css.divClose+
                css.diceLeft + css['dice' + herodc.parameters.type.toUpperCase()] + css.diceRight + css.fontSize15 + css.diceEnd + herodc.damage.dice.join(', ')+ css.lineBreak + css.divClose+
                css.damageContainerLeft + css.damageContainerN + css.damageContainerRight +
                   css.damageBoxLeft + css.colorBlue + css.damageBoxRight + 'Stun: '+ herodc.damage.stun+ css.divClose +
                   css.damageBoxLeft + css.colorRed + css.damageBoxRight + 'Body: '+ herodc.damage.body+ css.divClose +
                   css.damageBoxLeft + css.colorGreen + css.damageBoxRight +  herodc.damage.kblabel + herodc.damage.kb + css.divClose +
                   css.divClear +
                css.divClose;
                
        if (herodc.parameters.uselocation) {
            let titleLocation = herodc.damage.hitlocation.substr(0,1).toUpperCase() + herodc.damage.hitlocation.substr(1,herodc.damage.hitlocation.length -1);
            
            if(!herodc.parameters.skipside) {
                switch(titleLocation) {
                    case 'Chest':
                    case 'Head':
                        //titleLocation = titleLocation; 
                        if (herodc.damage.hitroll !== 0) titleLocation += ' (' + herodc.damage.hitroll + ')';
                        //else titleLocation += ": " + herodc.damage.hitrange // + ")"; //LOCATION RANGE
                        break;
                    case 'Vitals':
                    case 'Stomach':
                        break;
                    case 'Shoulder':
                        if (randomInteger(2)===1)
                            titleLocation = 'R ' + titleLocation;
                        else
                            titleLocation = 'L ' + titleLocation;
                        break;
                    default:
                        if (randomInteger(2)===1)
                            titleLocation = 'R ' + titleLocation;
                        else
                            titleLocation = 'L ' + titleLocation;
                        if (herodc.damage.hitroll !== 0) titleLocation += ' (' + herodc.damage.hitroll + ')';
                        //else titleLocation += ": " + herodc.damage.hitrange //+ ")"; //LOCATION RANGE
                }
            }
            let stunX = 'x' + herodc.damage.stunmult;
            let bodyX  = 'x' + herodc.damage.bodymult;
            switch(herodc.parameters.type) {
                case 's':
                    bodyX = '---';
                    break;
                case 'k':
                    stunX = '---';
            }
            chatString = chatString + 
                css.damageContainerLeft + css.damageContainerN + css.damageContainerRight +
                css.damageBoxLeft + css.colorBlue + css.damageBoxRight + stunX + css.divClose +
                css.damageBoxLeft + css.colorRed + css.damageBoxRight + bodyX + css.divClose +
                css.damageBoxLeft + css.colorGreen + css.damageBoxRight +  titleLocation + css.divClose +
                css.divClear +
                css.divClose;
            
        }
        chatString = chatString + css.divClose + css.divClose;
            
        sendChat( getSpeaker(msg),chatString);
        return;
    },
     
    registerEventHandlers = function() {
        on('chat:message', handleInput);
    };
    
    return {
        RegisterEventHandlers: registerEventHandlers
    };
    
}());

on('ready',function(){
    'use strict';
    herodc.RegisterEventHandlers();
});
