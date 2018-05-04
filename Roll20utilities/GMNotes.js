/*
GMNotes
Prints entire bio or gmnotes from a TOKEN, or specific lines if supply beginning of the line.
The companion script, CharNotes, prints from a CHARACTER.

!gmnote
!wgmnote
!gmnote-linebeginning
!gmnote-linebeginning

Script updated here: https://app.roll20.net/forum/permalink/6347021/
*/
on('ready',()=>{

    const blockElements = [
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ol', 'ul', 'pre', 'address',
        'blockquote', 'dl', 'div', 'fieldset', 'form', 'hr', 'noscript', 'table','br'
    ];
    const rStart=new RegExp(`<\\s*(?:${blockElements.join('|')})\\b[^>]*>`,'ig');
    const rEnd=new RegExp(`<\\s*\\/\\s*(?:${blockElements.join('|')})\\b[^>]*>`,'ig');

    const getLines = (str) => 
        (rStart.test(str)
            ? str
                .replace(/[\n\r]+/g,' ')
                .replace(rStart,'\r$&')
                .replace(rEnd,'$&\r')
                .split(/[\n\r]+/)
            : str
                .split(/(?:[\n\r]+|<br\/?>)/)
        )
            .map((s)=>s.trim())
            .filter((s)=>s.length)
            ;
    const cmdRegex = /^!(w?)gmnote(?:-(.*))?$/i;

    on('chat:message',(msg) => {
        if('api' === msg.type && cmdRegex.test(msg.content) && playerIsGM(msg.playerid) ){
            let match=msg.content.match(cmdRegex),
                output = match[1].length ? '/w gm ' : '',
                regex;

            if(match[2]){
                regex = new RegExp(`^${match[2]}`,'i');
            }
                                
            _.chain(msg.selected)
                .map( s => getObj('graphic',s._id))
                .reject(_.isUndefined)
                .reject((o)=>o.get('gmnotes').length===0)
                .each( o => {
                    if(regex){
                        let lines = _.filter(
                            getLines(unescape(o.get('gmnotes'))),
                            (l) => regex.test(l.replace(/<[^>]*>/g,''))
                        ).join('<br>');
                        sendChat(o.get('name'), `${output}${lines}`);
                    } else {
                        sendChat(o.get('name'), `${output}${unescape(o.get('gmnotes')).replace(/(?:[\n\r]+|<br\/?>)/g,'<br>')}`);
                    }
                });
        }
    });
});