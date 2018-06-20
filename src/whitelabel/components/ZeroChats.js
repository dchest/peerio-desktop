const config = require('~/config');

let ZeroChats = require('~/ui/chat/ZeroChats');

if (config.whiteLabel.name === 'medcryptor') {
    ZeroChats = require('~/ui/chat/ZeroChats_medcryptor');
}

module.exports = ZeroChats;
