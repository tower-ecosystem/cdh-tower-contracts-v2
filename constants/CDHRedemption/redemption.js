const redemptionVerifier = '0x6036Ab472708F025d5DABAC89E8A152E12342125';
const redemptionConstructor = {
  31337: {
    _cdhNft: '0x0B306BF915C4d645ff596e518fAf3F9669b97016',
    _towerInventory: '0x7a2088a1bFc9d81c55368AE168C2C02570cB814F',
    _equipmentPool: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    _heroPool: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
    _spellPool: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    _towerPool: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
    _blackHoleAddress: '0x000000000000000000000000000000000000dead',
    _randomNumberSigner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  },
  80001: {
    _cdhNft: '0x432de13822e0b891748b632cd94f85ba4cbbcdfa',
    _towerInventory: '0x548113963502fa7e152c5b17ab6fdeb5c4aaa0bc',
    _equipmentPool: '0x64af80fe924e1c8ba1a98b13549e80bce5cb8ded',
    _heroPool: '0x3af54d0cdd9e9b7b0b5bf3cfe3d0b87939783f3b',
    _spellPool: '0x3b38d6da62c8aa5509090090a7a933bbcd77ab54',
    _towerPool: '0x5ac0aa014a500416af50c3c3f81577a70018086f',
    _blackHoleAddress: '0x000000000000000000000000000000000000dead',
    _randomNumberSigner: '0x479d1dae95261b39fb39c4477141da60fac8d50a',
  },
  137: {
    _cdhNft: '0xc7648018C4269f27beD41735491a328E2Ecd49d2',
    _towerInventory: '0x9eda8151717f39c93d9f2f823fbcd012229b3cac',
    _equipmentPool: '0x1B15Aa9fe8bcfdBe3Ed14b196a43e88a484dAD01',
    _heroPool: '0x723C4d79A0c270772bf90fDAa58a422fCb501466',
    _spellPool: '0x8482EdfbEC4d036E02f0AFC4748C85c641238321',
    _towerPool: '0xCF0bC2734019f4c940382705D8df08f13bC5f81d',
    _blackHoleAddress: '0x000000000000000000000000000000000000dead', // should be 0xdead wallet
    _randomNumberSigner: '0x2A11e98902A14259Aa38CCd225F391dB6C6065c3', // inventory-minter-private-key
  },
};

module.exports = {
  redemptionVerifier,
  redemptionConstructor,
};
