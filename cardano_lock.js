const {mnemonicToEntropy} = require("bip39");
const cardano = require('@emurgo/cardano-serialization-lib-nodejs')
const ms = require('@emurgo/cardano-message-signing-nodejs')

const harden = (num) => {
  return 0x80000000 + num;
};

function toHex(str) {
  var result = '';
  for (var i=0; i<str.length; i++) {
    result += str.charCodeAt(i).toString(16);
  }
  return result;
}

async function main () {
  const mnemonic = 'wild goat define arctic hard pyramid benefit shrug knock chase tuition survey gentle curtain blossom oblige profit flash town obtain mandate symptom connect payment'
  const accountIndex = 0;
  const payload = Uint8Array.from(Buffer.from('846a5369676e6174757265315846a20127676164647265737358390091e4c8bb', 'hex'))
  console.log('payload:', payload)
  const entropy = mnemonicToEntropy(mnemonic)
  // console.log(entropy)
  const rootKey = cardano.Bip32PrivateKey.from_bip39_entropy(Buffer.from(entropy, 'hex'), Buffer.from(''))
  // console.log(`rootKey: ${rootKey.to_raw_key().as_bytes()}`)
  const accountKey = rootKey.derive(harden(1852)).derive(harden(1815)).derive(harden(accountIndex))
  const paymentKey = accountKey.derive(0).derive(0).to_raw_key()
  const stakeKey = accountKey.derive(2).derive(0).to_raw_key()
  // console.log(`paymentKey: ${paymentKey.to_public().to_bech32()}`)
  // console.log({ paymentKey, stakeKey })
  // accountIndex = 0
  // const address = "0091ed4c8bbe6eeb4b94eb450b2b38ad0efd6fbafb98c371466a9ace12e8a9c6238b6c39819452b43c90d1177641288ecd791a63663aa9fe6b"
  // // accountIndex = 1
  // const address = "007fa6f7c118be799b8916266430649999bd90c4c142f4b5dfc25fc78a094af81b63162d9872b7af51d885b301ee3d99d6ded22e38a0e3c762"
  // const baseAddr = cardano.BaseAddress.from_address(cardano.Address.from_bytes(Buffer.from(address, 'hex')))
  // const baseAddr = cardano.BaseAddress.from_address(cardano.Address.from_bech32('addr_test1qzg76nythehwkju5adzsk2ec45806ma6lwvvxu2xd2dvuyhg48rz8zmv8xqeg5458jgdz9mkgy5ganterf3kvw4fle4ss8cv2l'))
  // console.log(`baseAddr: ${baseAddr.to_address().to_bech32()}`)
  const baseAddr = cardano.BaseAddress.new(
    0,
    cardano.StakeCredential.from_keyhash(paymentKey.to_public().hash()),
    cardano.StakeCredential.from_keyhash(stakeKey.to_public().hash()),
  )
  // console.log('baseAddr:', baseAddr.to_address().to_bytes())
  console.log('paymentKeyHash:', paymentKey.to_public().hash().to_bytes())
  console.log('stakeKeyHash:', stakeKey.to_public().hash().to_bytes())
  // const keyHash = baseAddr.payment_cred().to_keyhash().to_bech32('hbas_')
  // console.log(`keyHash  : ${keyHash}`)
  // const prefix = keyHash.slice(0, 5);
  // const signKey = prefix === 'hbas_' ? paymentKey : stakeKey;
  // console.log({ signKey })
  // console.log(`signKey  : ${signKey.as_bytes()}`)
  // console.log(`signKey2 : ${ cardano.PrivateKey.from_extended_bytes(signKey.as_bytes()).as_bytes()}`)
  const signKey = paymentKey;
  const address = Buffer.from(baseAddr.to_address().to_bytes()).toString('hex')
  // console.log(`address  : ${address}`)
  const publicKey = signKey.to_public();
  // console.log(`publicKey: ${publicKey.hash().to_bech32(prefix)}`)
  // if (keyHash !== publicKey.hash().to_bech32(prefix))
  //   throw 'wrong address';

  const protectedHeaders = ms.HeaderMap.new();
  protectedHeaders.set_algorithm_id(
    ms.Label.from_algorithm_id(ms.AlgorithmId.EdDSA)
  );
  // protectedHeaders.set_key_id(publicKey.as_bytes());
  protectedHeaders.set_header(
    ms.Label.new_text('address'),
    ms.CBORValue.new_bytes(Buffer.from(address, 'hex'))
  );
  const protectedSerialized =
    ms.ProtectedHeaderMap.new(protectedHeaders);
  const unprotectedHeaders = ms.HeaderMap.new();
  const headers = ms.Headers.new(
    protectedSerialized,
    unprotectedHeaders
  );
  const builder = ms.COSESign1Builder.new(
    headers,
    Buffer.from(payload, 'hex'),
    false
  );
  const toSign = builder.make_data_to_sign().to_bytes();
  console.log(`new_message: `, toSign)
  console.log(`new_message_hex: `, Buffer.from(toSign).toString('hex'))
  console.log('extract payload from new_message:', ms.SigStructure.from_bytes(toSign).payload())

  const key = ms.COSEKey.new(
    ms.Label.from_key_type(ms.KeyType.OKP)
  );
  key.set_algorithm_id(
    ms.Label.from_algorithm_id(ms.AlgorithmId.EdDSA)
  );
  key.set_header(
    ms.Label.new_int(
      ms.Int.new_negative(ms.BigNum.from_str('1'))
    ),
    ms.CBORValue.new_int(
      ms.Int.new_i32(6) //ms.CurveType.Ed25519
    )
  ); // crv (-1) set to Ed25519 (6)
  key.set_header(
    ms.Label.new_int(
      ms.Int.new_negative(ms.BigNum.from_str('2'))
    ),
    ms.CBORValue.new_bytes(publicKey.as_bytes())
  ); // x (-2) set to public key
  const keyHex = Buffer.from(key.to_bytes()).toString('hex');
  // console.log(`key: ${keyHex}`)

  const signedSigStruc = signKey.sign(toSign).to_bytes();
  const coseSign1 = builder.build(signedSigStruc);
  const sig = Buffer.from(coseSign1.to_bytes()).toString('hex');
  // console.log(`sig: ${sig}`)
  // console.log('data returned from nami wallet: ',{
  //   address,
  //   signedData: {
  //     key: keyHex,
  //     sig,
  //   }
  // })

  // simulate get info for composing tx
  const sig2 = ms.COSESign1.from_bytes(Buffer.from(sig, 'hex'));
  console.log('signature:', sig2.signature());
  const key2 = ms.COSEKey.from_bytes(Buffer.from(keyHex, 'hex'));
  console.log('pubkey:', key2.header(ms.Label.new_int(ms.Int.new_negative(ms.BigNum.from_str('2')))).as_bytes());
  // console.log(publicKey.as_bytes())
}

main().then(() => {
  console.log('----------finish----------')
  process.exit(0)
}).catch((err) => {
  console.error(err)
  process.exit(1)
})