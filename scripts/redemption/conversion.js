const goldTokenInfo = require('./tokenInfoGold.json');
const silverTokenInfo = require('./tokenInfoSilver.json');
const bronzeTokenInfo = require('./tokenInfoBronze.json');
const fs = require('fs');

let goldCount = silverCount = bronzeCount = 0;
goldTokenInfo.forEach((info,index) => {
    info['index'] = (index%5)+1;
    goldCount+=1;  
})

silverTokenInfo.forEach((info,index) => {
    info['index'] = (index%4)+1;
    silverCount+=1;  
})

bronzeTokenInfo.forEach((info,index) => {
    info['index'] = (index%3)+1;
    bronzeCount+=1;  
})

console.log(`Total gold token: ${goldCount} \n Total silver token: ${silverCount} \n Total bronze token: ${bronzeCount}`)
fs.writeFileSync('tokenInfoGold.json',JSON.stringify(goldTokenInfo));
fs.writeFileSync('tokenInfoSilver.json',JSON.stringify(silverTokenInfo));
fs.writeFileSync('tokenInfoBronze.json',JSON.stringify(bronzeTokenInfo));




