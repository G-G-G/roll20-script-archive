/*
GMNotes
Prints entire bio or gmnotes from a TOKEN, or specific lines if supply beginning of the line.
The copanion script, GMNotes, prints from a CHARACTER.

!gmnotes
!gmnotes-linebeginning


*/
on('ready', function () {
    'use strict';

    const decodeUnicode = (str) => str.replace(/%u[0-9a-fA-F]{2,4}/g, (m) => String.fromCharCode(parseInt(m.slice(2), 16)));

    on('chat:message', function (msg) {
        if ('api' === msg.type && msg.content.match(/^!gmnote/) && playerIsGM(msg.playerid)) {
            let match = msg.content.match(/^!gmnote-(.*)$/),
                regex;
            if (match && match[1]) {
                regex = new RegExp(`^${match[1]}`, 'i');
            }

            _.chain(msg.selected)
                .map(s => getObj('graphic', s._id))
                .reject(_.isUndefined)
                .reject((o) => o.get('gmnotes').length === 0)
                .each(o => {
                    if (regex) {
                        let lines = _.filter(decodeURIComponent(decodeUnicode(o.get('gmnotes'))).split(/(?:[\n\r]+|<br\/?>)/), (l) => regex.test(l)).join('\r');
                        sendChat(o.get('name'), `/w gm ` + lines);
                    } else {
                        sendChat(o.get('name'), '/w gm &{template:5e-shaped}{{title=' + o.get('name') + '}} {{text=' + decodeURIComponent(decodeUnicode(o.get('gmnotes'))) + '}}');
                    }
                });
        }
    });
});