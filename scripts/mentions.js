
exports.getLastMention = function(contentArray,members){
    lastMention = 1;
    contentArray.forEach( (c,index) => {
        members.forEach( (m) => {
            lastMention = c.indexOf(m.id) !== -1 && lastMention < index ? index : lastMention;
        });
    });
    return lastMention;
}