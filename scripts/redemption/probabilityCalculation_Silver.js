let silverTokenInfo = require('./tokenInfoSilver.json');

const tokensInfoInBatch = [];

while (true) {
  tokensInfoInBatch.push(silverTokenInfo.slice(0, 4));

  silverTokenInfo = silverTokenInfo.slice(4, silverTokenInfo.length);

  if (!silverTokenInfo.length) {
    break;
  }
}

const firstCard = {Rare: 0, Epic: 0, Legendary: 0, totalCards: 0};
const secondCard = {Rare: 0, Epic: 0, Legendary: 0, totalCards: 0};
const thirdCard = {Rare: 0, Epic: 0, Legendary: 0, totalCards: 0};
const fourthCard = {Rare: 0, Epic: 0, Legendary: 0, totalCards: 0};

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
    if (index === 4) {
      fourthCard[rarity] += 1;
      fourthCard.totalCards += 1;
    }
  }
}

console.log('---------------Silver--------');
console.log('For 1st card');
const totalFirstCards = firstCard['totalCards'];
const rareCardProbabilityInFirstCards = firstCard['Rare'] / totalFirstCards;
const epicCardProbabilityInFirstCards = firstCard['Epic'] / totalFirstCards;
const legendaryCardProbabilityInFirstCards = firstCard['Legendary'] / totalFirstCards;
console.log(
  `Rare: ${rareCardProbabilityInFirstCards} Epic: ${epicCardProbabilityInFirstCards} Legendary: ${legendaryCardProbabilityInFirstCards} Total probability: ${
    rareCardProbabilityInFirstCards + epicCardProbabilityInFirstCards + legendaryCardProbabilityInFirstCards
  }`
);

console.log('For 2nd card');
const totalSecondCards = secondCard['totalCards'];
const rareCardProbabilityInSecondCards = secondCard['Rare'] / totalSecondCards;
const epicCardProbabilityInSecondCards = secondCard['Epic'] / totalSecondCards;
const legendaryCardProbabilityInSecondCards = secondCard['Legendary'] / totalSecondCards;
console.log(
  `Rare: ${rareCardProbabilityInSecondCards} Epic: ${epicCardProbabilityInSecondCards} Legendary: ${legendaryCardProbabilityInSecondCards} Total probability: ${
    rareCardProbabilityInSecondCards + epicCardProbabilityInSecondCards + legendaryCardProbabilityInSecondCards
  }`
);

console.log('For 3rd card');
const totalThirdCards = thirdCard['totalCards'];
const rareCardProbabilityInThirdCards = thirdCard['Rare'] / totalThirdCards;
const epicCardProbabilityInThirdCards = thirdCard['Epic'] / totalThirdCards;
const legendaryCardProbabilityInThirdCards = thirdCard['Legendary'] / totalThirdCards;
console.log(
  `Rare: ${rareCardProbabilityInThirdCards} Epic: ${epicCardProbabilityInThirdCards} Legendary: ${legendaryCardProbabilityInThirdCards} Total probability: ${
    rareCardProbabilityInThirdCards + epicCardProbabilityInThirdCards + legendaryCardProbabilityInThirdCards
  }`
);

console.log('For 4th card');
const totalFourthCards = fourthCard['totalCards'];
const rareCardProbabilityInFourthCards = fourthCard['Rare'] / totalFourthCards;
const epicCardProbabilityInFourthCards = fourthCard['Epic'] / totalFourthCards;
const legendaryCardProbabilityInFourthCards = fourthCard['Legendary'] / totalFourthCards;
console.log(
  `Rare: ${rareCardProbabilityInFourthCards} Epic: ${epicCardProbabilityInFourthCards} Legendary: ${legendaryCardProbabilityInFourthCards} Total probability: ${
    rareCardProbabilityInFourthCards + epicCardProbabilityInFourthCards + legendaryCardProbabilityInFourthCards
  }`
);
