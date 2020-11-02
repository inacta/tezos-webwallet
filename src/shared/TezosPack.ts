import BigNumber from 'bignumber.js';
import { validateAddress, ValidationResult, b58decode } from '@taquito/utils';

export function toHexString(byteArray: Uint8Array) {
  return Array.prototype.map
    .call(byteArray, function(byte) {
      return ('0' + (byte & 0xff).toString(16)).slice(-2);
    })
    .join('');
}

function toByteArray(hexString: string): Uint8Array {
  var result = new Uint8Array(hexString.length / 2);
  for (var i = 0; i < hexString.length; i += 2) {
    result[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }

  return result;
}

// Convert an integer to a byte array following the
// Tezos serialization standard
function packInteger(input: BigNumber) {
  if (!(input instanceof BigNumber)) {
    throw Error('Input must be of type BigNumber');
  }

  let binaryString = input.toString(2);
  var pad = 6;
  if ((binaryString.length - 6) % 7 === 0) {
    pad = binaryString.length;
  } else if (binaryString.length > 6) {
    pad = binaryString.length + 7 - ((binaryString.length - 6) % 7);
  }

  binaryString = binaryString.padStart(pad, '0');

  var septets = [];
  for (let i = 0; i <= Math.floor(pad / 7); i++) {
    const val = binaryString.substring(7 * i, 7 * i + Math.min(7, pad - 7 * i));
    septets.push(val);
  }

  septets = septets.reverse();
  septets[0] = (input.isGreaterThanOrEqualTo(new BigNumber(0)) ? '0' : '1') + septets[0];

  var res = new Uint8Array(septets.length + 1);
  for (let i = 0; i < septets.length; i++) {
    var prefix = i === septets.length - 1 ? '0' : '1';
    res[i + 1] = parseInt(prefix + septets[i], 2);
  }

  // Add type indication for integer = 0x00
  res[0] = 0;

  return res;
}

// $ ligo interpret -s pascaligo 'Bytes.pack(set [1])' 0502000000020001
function packIntegerSet(input: BigNumber[]) {
  if (!Array.isArray(input)) {
    throw Error('Input must be of type array');
  }

  // Sort integers since activities are stored as set(nat), and set is sorted internally
  // This means that the hash preimage is generated from a sorted sequence of integers, and
  // that must be reflected here
  input.sort();

  const packedIntegers = input.map((x) => packInteger(x));
  const lengthOfValues = packedIntegers.reduce((a, b) => a + b.length, 0);
  var res = new Uint8Array(lengthOfValues + 5);
  res[0] = 2; // indicates `sequence`

  // add size indication
  var SizeInHex = lengthOfValues.toString(16).padStart(8, '0');
  for (let i = 0; i < 4; i++) {
    res[i + 1] = parseInt(SizeInHex.substring(2 * i, 2 * i + 2), 16);
  }

  var offset = 5;
  for (let i = 0; i < packedIntegers.length; i++) {
    const packed = packedIntegers[i];
    res.set(packed, offset);
    offset += packed.length;
  }

  return res;
}

function packAddress(input: string) {
  if (!(typeof input === 'string')) {
    throw Error('Input address must be of type string');
  }

  if (validateAddress(input) !== ValidationResult.VALID) {
    throw Error('Input is not a valid address. Got: ' + input);
  }

  var hex = b58decode(input);

  // 0a indicates byte array, the next four bytes indicate length
  // in bytes
  return toByteArray('0a00000016' + hex);
}

function packAddressSet(input: string[]) {
  if (!Array.isArray(input)) {
    throw Error('Input must be of type array');
  }

  // Sort addresses, since set is represented as a sorted sequence internally in Michelson.
  // Cf. the documentation, addresses are compared (and thus sorted) lexicographically,
  // but implicit accounts (those that start with 'tz') are ordered before the originated
  // accounts (those accounts controlled by a smart contract).
  // https://michelson.nomadic-labs.com/#instr-COMPARE
  let originatedAccounts = input.filter((x) => x.startsWith('KT1'));
  originatedAccounts.sort();
  let implicitAccounts = input.filter((x) => x.startsWith('tz'));
  implicitAccounts.sort();
  const sortedAddresses = implicitAccounts.concat(originatedAccounts);

  const packedAddresses = sortedAddresses.map((x) => packAddress(x));
  const lengthOfValues = packedAddresses.reduce((a, b) => a + b.length, 0);
  var res = new Uint8Array(lengthOfValues + 5);
  res[0] = 2; // indicates `sequence`

  // add size indication
  var SizeInHex = lengthOfValues.toString(16).padStart(8, '0');
  for (let i = 0; i < 4; i++) {
    res[i + 1] = parseInt(SizeInHex.substring(2 * i, 2 * i + 2), 16);
  }

  var offset = 5;
  for (let i = 0; i < packedAddresses.length; i++) {
    const packed = packedAddresses[i];
    res.set(packed, offset);
    offset += packed.length;
  }

  return res;
}

/**
 * Return the byte array resulting from `PACK` on `PAIR (PAIR (PAIR <nonce> <minutes>) <activities>) <recipients>`
 * of type PAIR (PAIR (PAIR nat nat) set(nat)) set(address)
 * Bytes.pack((((nonce, signed_claim.minutes), signed_claim.activities), signed_claim.recipients));
 */
export function packFourTupleAsLeftBalancedPairs(
  nonce: BigNumber,
  minutes: BigNumber,
  activities: BigNumber[],
  recipients: string[]
): Uint8Array {
  // 0x050707070707070001000200030004
  // Input validation happens in these helper functions
  var noncePacked = packInteger(nonce);
  var minutesPacked = packInteger(minutes);
  var activitiesPacked = packIntegerSet(activities);
  var recipientsPacked = packAddressSet(recipients);

  // The 0x05 is the prefix for all return values from the `PACK` instruction
  // The 0x07 indicates the pair type constructor.
  var res = new Uint8Array(
    7 + noncePacked.length + minutesPacked.length + activitiesPacked.length + recipientsPacked.length
  );
  res[0] = 5;
  res[1] = 7;
  res[2] = 7;
  res[3] = 7;
  res[4] = 7;
  res[5] = 7;
  res[6] = 7;
  res.set(noncePacked, 7);
  res.set(minutesPacked, 7 + noncePacked.length);
  res.set(activitiesPacked, 7 + noncePacked.length + minutesPacked.length);
  res.set(recipientsPacked, 7 + noncePacked.length + minutesPacked.length + activitiesPacked.length);

  return res;
}
