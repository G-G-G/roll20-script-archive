/*
CharNotes
Source: https://app.roll20.net/forum/permalink/6317945/

Prints entire bio or gmnotes from a CHARACTER, or specific lines if supply beginning of the line.
The copanion script, GMNotes, prints from a TOKEN.

!cbio
!cgmnotes
!cbio-Some Line Beginning
!cgmnotes-Some Line Beginning

*/
on('ready', function () {
    'use strict';

    const decodeUnicode = (str) => str.replace(/%u[0-9a-fA-F]{2,4}/g, (m) => String.fromCharCode(parseInt(m.slice(2), 16)));

    on('chat:message', function (msg) {
        if ('api' === msg.type && msg.content.match(/^!c(gmnotes|bio)/) && playerIsGM(msg.playerid)) {
            let match = msg.content.match(/^!c(gmnotes|bio)(?:-(.*))?$/),
                where = match[1],
                regex;

            if (match && match[2]) {
                regex = new RegExp(`^${match[2]}`, 'i');
            }

            _.chain(msg.selected)
                .map(s => getObj('graphic', s._id))
                .reject(_.isUndefined)
                .map(t => getObj('character', t.get('represents')))
                .reject(_.isUndefined)
                .each(c => c.get(where, (val) => {
                    if (null !== val) {
                        if (regex) {
                            let lines = _.filter(
                                decodeUnicode(val).split(/(?:[\n\r]+|<br\/?>)/),
                                (l) => regex.test(l.replace(/<[^>]*>/g, ''))
                            ).join('\r');
                            sendChat(c.get('name'), `/w gm ` + lines);
                        } else {
                            sendChat(c.get('name'), '/w gm &{template:5e-shaped}{{title=' + c.get('name') + '}} {{text=' + decodeUnicode(val) + '}}');
                        }
                    }
                }));
        }
    });
});