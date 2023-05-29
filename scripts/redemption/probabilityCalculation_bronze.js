let bronzeTokenInfo = require('./tokenInfoBronze.json');

const tokensInfoInBatch = [];

while (true) {
  tokensInfoInBatch.push(bronzeTokenInfo.slice(0, 3));

  bronzeTokenInfo = bronzeTokenInfo.slice(3, bronzeTokenInfo.length);

  if (!bronzeTokenInfo.length) {
    break;
  }
}

const firstCard = {Common: 0, Rare: 0, Epic: 0, totalCards: 0};
const secondCard = {Common: 0, Rare: 0, Epic: 0, totalCards: 0};
const thirdCard = {Common: 0, Rare: 0, Epic: 0, totalCards: 0};

for (let tokenList of tokensInfoInBatch) {
  for (let index = 1; index <= tokenList.length; index++) {
    const rarity = tokenList[index - 1].rarity;
    if (index === 1) {
      firstCard[rarity] += 1;
      firstCard.totalCards += 1;
    }
    if (index === 2) {
      secondCard[rarity] += 1;
      secondCard.totalCards += 1;
    }
    if (index === 3) {
      thirdCard[rarity] += 1;
      thirdCard.totalCards += 1;
    }
  }
}

console.log('---------------BRONZE-----------');
console.log('For 1st card');
const totalFirstCards = firstCard['totalCards'];
const rareCardProbabilityInFirstCards = firstCard['Rare'] / totalFirstCards;
const epicCardProbabilityInFirstCards = firstCard['Epic'] / totalFirstCards;
const commonCardProbabilityInFirstCards = firstCard['Common'] / totalFirstCards;
console.log(
  `
  Rare: ${rareCardProbabilityInFirstCards} \
  Epic: ${epicCardProbabilityInFirstCards} \
  Common: ${commonCardProbabilityInFirstCards} \
  Total probability: ${rareCardProbabilityInFirstCards + epicCardProbabilityInFirstCards + commonCardProbabilityInFirstCards}
  `
);

console.log('For 2nd card');
const totalSecondCards = secondCard['totalCards'];
const rareCardProbabilityInSecondCards = secondCard['Rare'] / totalSecondCards;
const epicCardProbabilityInSecondCards = secondCard['Epic'] / totalSecondCards;
const commonCardProbabilityInSecondCards = secondCard['Common'] / totalSecondCards;
console.log(
  `
  Rare: ${rareCardProbabilityInSecondCards} \
  Epic: ${epicCardProbabilityInSecondCards} \
  Common: ${commonCardProbabilityInSecondCards} \
  Total probability: ${rareCardProbabilityInSecondCards + epicCardProbabilityInSecondCards + commonCardProbabilityInSecondCards}
  `
);

console.log('For 3rd card');
const totalThirdCards = thirdCard['totalCards'];
const rareCardProbabilityInThirdCards = thirdCard['Rare'] / totalThirdCards;
const epicCardProbabilityInThirdCards = thirdCard['Epic'] / totalThirdCards;
const commonCardProbabilityInThirdCards = thirdCard['Common'] / totalThirdCards;
console.log(
  `
  Rare: ${rareCardProbabilityInThirdCards} \
  Epic: ${epicCardProbabilityInThirdCards} \
  Common: ${commonCardProbabilityInThirdCards} \
  Total probability: ${rareCardProbabilityInThirdCards + epicCardProbabilityInThirdCards + commonCardProbabilityInThirdCards}
  `
);
