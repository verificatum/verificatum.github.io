// Copyright 2008-2022 Douglas Wikstrom
var verificatum;
(function(verificatum) {
    let base;
    (function(base) {
        base.version = "1.0.0";
        /**
         * Base class for all objects in the library.
         */
        class VerificatumObject {
            /**
             * Returns the name of this class.
             *
             * @returns Name of this class.
             */
            getName() {
                return this.constructor.name;
            }
        }
        base.VerificatumObject = VerificatumObject;
        /**
         * Abstract random source for cryptographic use.
         */
        class RandomSource {}
        base.RandomSource = RandomSource;
        /**
         * Utility classes and functions.
         * TSDOC_MODULE
         */
        /* eslint-disable @typescript-eslint/no-explicit-any */
        /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
        /**
         * Tests if an object is an instance of the given class.
         *
         * @param obj - Object to test.
         * @param type - Class.
         * @returns True or false depending on the object is an instance of
         * the class or not.
         */
        function ofClass(obj, atype) {
            if (typeof obj === "undefined") {
                return false;
            } else {
                return obj.constructor === atype;
            }
        }
        base.ofClass = ofClass;
        /**
         * Tests if an object is an instance of the given class, or a a
         * subclass of the given class.
         *
         * @param obj - Object to test.
         * @param atype - Class.
         * @returns True or false.
         */
        function ofSubclass(obj, atype) {
            while (obj != null && typeof obj != "undefined") {
                if (obj.constructor === atype) {
                    return true;
                } else {
                    obj = Object.getPrototypeOf(obj);
                }
            }
            return false;
        }
        base.ofSubclass = ofSubclass;
        /**
         * Tests if an object is an instance of the given class, array, or
         * primitive type.
         *
         * @param obj - Object to test.
         * @param atype - Class, "array", or a string admissable to the typeof
         * operator.
         * @returns True or false.
         */
        function ofType(obj, atype) {
            if (typeof atype === "string") {
                if (atype === "array") {
                    return Array.isArray(obj);
                } else if (atype === "string") {
                    return typeof obj === atype || obj instanceof String;
                } else {
                    return typeof obj === atype;
                }
            } else {
                return ofClass(obj, atype);
            }
        }
        base.ofType = ofType;
        /* eslint-enable @typescript-eslint/explicit-module-boundary-types */
        /* eslint-enable @typescript-eslint/no-explicit-any */
        /**
         * Verifies that an array of numbers is an array of bytes.
         *
         * @param value - Array to be verified.
         * @returns True or false depending on if the array is a byte array or
         * not.
         */
        function isByteArray(value) {
            for (let i = 0; i < value.length; i++) {
                if (!Number.isInteger(value[i]) || (value[i] & 0xFF) != value[i]) {
                    return false;
                }
            }
            return true;
        }
        base.isByteArray = isByteArray;
        /**
         * Verifies that a string is a hexadecimal string.
         *
         * @param value - String to be verified.
         * @returns True or false depending on if the string is hexadecimal or
         * not.
         */
        function isHexString(value) {
            for (let i = 0; i < value.length; i++) {
                const x = value.charCodeAt(i);
                if (!((47 < x && x < 58) // x in [0,9] Case insensitive
                        ||
                        (64 < x && x < 71) // x in [A,F] hexadecimal character.
                        ||
                        (96 < x && x < 103))) { // x in [a,f]
                    return false;
                }
            }
            return true;
        }
        base.isHexString = isHexString;
        /**
         * Creates a list filled with the same value.
         *
         * @param value - Value to be repeated.
         * @param width - Number of repetitions.
         * @returns List containing the value.
         */
        function fill(value, width) {
            const a = [];
            for (let i = 0; i < width; i++) {
                a[i] = value;
            }
            return a;
        }
        base.fill = fill;
        /**
         * Creates a list filled with the same value or the value
         * itself if a single repetition is requested.
         *
         * @param value - Value to be repeated.
         * @param width - Number of repetitions.
         * @returns List containing the value or the value itself if width == 1.
         */
        function full(value, width) {
            if (typeof width === "undefined" || width === 1) {
                return value;
            } else {
                return fill(value, width);
            }
        }
        base.full = full;
        /**
         * Changes the wordsize of an array of words.
         *
         * @param words - Array of words.
         * @param orig_wordsize - Original bitsize of words (at most 32).
         * @param new_wordsize - Bitsize of output words (at most 32).
         * @returns Representation of the input array of bits with new
         * wordsize.
         */
        function change_wordsize(words, orig_wordsize, new_wordsize) {
            const mask_all = 0xFFFFFFFF >>> 32 - new_wordsize;
            // Array with new wordsize holding result.
            const new_words = [];
            new_words[0] = 0;
            // Encodes bit position in words.
            let j = 0;
            let jb = 0;
            // Encodes bit position in new_words.
            let i = 0;
            let ib = 0;
            while (j < words.length) {
                // Insert as many bits as possible from words[j] into new_words[i].
                new_words[i] |= words[j] >>> jb << ib & mask_all;
                // Number of inserted bits.
                const inserted_bits = Math.min(orig_wordsize - jb, new_wordsize - ib);
                // Determine if we have filled new_words[i] and if so, then move on
                // to the beginning of the next word.
                ib = ib + inserted_bits;
                if (ib === new_wordsize) {
                    i++;
                    ib = 0;
                    new_words[i] = 0;
                }
                // Determine the number of remaining unused bits of words[j] and
                // if none are left, then move on to the beginning of the next
                // word.
                jb = jb + inserted_bits;
                if (jb === orig_wordsize) {
                    j++;
                    jb = 0;
                }
            }
            return new_words;
        }
        base.change_wordsize = change_wordsize;
        const digits = "0123456789abcdef";

        function hexbyte(b) {
            return digits[b >> 4 & 0xF] + digits[b & 0xF];
        }
        base.hexbyte = hexbyte;
        /**
         * Converts an ASCII string to a byte array.
         *
         * @param ascii - ASCII string.
         * @returns Corresponding byte array.
         */
        function asciiToByteArray(ascii) {
            const bytes = [];
            for (let i = 0; i < ascii.length; i++) {
                bytes.push(ascii.charCodeAt(i));
            }
            return bytes;
        }
        base.asciiToByteArray = asciiToByteArray;
        /**
         * Returns the input if it is already a byte array and converts it to
         * a byte array from an ASCII string otherwise.
         *
         * @param data - Data.
         * @returns Corresponding byte array.
         */
        function asByteArray(data) {
            if (typeof data === "string") {
                return asciiToByteArray(data);
            } else {
                return data;
            }
        }
        base.asByteArray = asByteArray;
        /**
         * Converts byte array to ASCII string.
         *
         * @param bytes - Input bytes.
         * @returns ASCII string corresponding to the input.
         */
        function byteArrayToAscii(bytes) {
            let ascii = "";
            for (let i = 0; i < bytes.length; i++) {
                ascii += String.fromCharCode(bytes[i]);
            }
            return ascii;
        }
        base.byteArrayToAscii = byteArrayToAscii;
        /**
         * Converts a byte array to its hexadecimal encoding.
         *
         * @param bytes - Input byte array.
         * @returns Hexadecimal representation of this array.
         */
        function byteArrayToHex(bytes) {
            let hexString = "";
            for (let i = 0; i < bytes.length; i++) {
                hexString += hexbyte(bytes[i]);
            }
            return hexString;
        }
        base.byteArrayToHex = byteArrayToHex;
        /**
         * Converts a hexadecimal encoding of a byte array to the
         * byte array.
         *
         * @param hex - Hexadecimal encoding of byte array.
         * @returns Byte array corresponding to the input.
         */
        function hexToByteArray(hex) {
            // Correct hex strings of uneven length.
            if (hex.length % 2 === 1) {
                hex = "0" + hex;
            }
            // Convert bytes.
            const res = [];
            let i = 0;
            hex.replace(/(..)/g, function(hex) {
                res[i++] = parseInt(hex, 16);
                return "";
            });
            return res;
        }
        base.hexToByteArray = hexToByteArray;
        /**
         * Returns the input if it is already a byte array and converts it to
         * a byte array from an hexadecimal encoding otherwise.
         *
         * @param data - Data.
         * @returns Corresponding byte array.
         */
        function hexAsByteArray(data) {
            if (typeof data === "string") {
                return hexToByteArray(data);
            } else {
                return data;
            }
        }
        base.hexAsByteArray = hexAsByteArray;

        function hexToArrayBuffer(hex) {
            const byteArray = hexToByteArray(hex);
            const arrayBuffer = new ArrayBuffer(byteArray.length);
            const array8 = new Uint8Array(arrayBuffer);
            array8.set(byteArray);
            return arrayBuffer;
        }
        base.hexToArrayBuffer = hexToArrayBuffer;
        /**
         * Returns true or false depending on if the two input
         * arrays hold identical elements or not.
         *
         * @param x - Array of elements.
         * @param y - Array of elements.
         * @returns Value of boolean equality predicate for arrays.
         */
        function equalsArray(x, y) {
            if (x.length !== y.length) {
                return false;
            }
            for (let i = 0; i < x.length; i++) {
                if (x[i] !== y[i]) {
                    return false;
                }
            }
            return true;
        }
        base.equalsArray = equalsArray;
        /**
         * Generates random array of the given length and
         * wordsize.
         *
         * @param len - Number of nominal bits in random output.
         * @param wordsize - Number of bits in each word.
         * @param randomSource - Source of randomness.
         * @returns Array of randomly generated words.
         */
        function randomArray(len, wordsize, randomSource) {
            const no_bytes = Math.floor((len * wordsize + 7) / 8);
            const bytes = randomSource.getBytes(no_bytes);
            const no_msbits = wordsize % 8;
            if (no_msbits !== 0) {
                bytes[no_bytes - 1] &= 0xFF >>> 8 - no_msbits;
            }
            if (wordsize === 8) {
                return bytes;
            } else {
                return change_wordsize(bytes, 8, wordsize);
            }
        }
        base.randomArray = randomArray;
        /**
         * Reads a 32-bit integer in little-endian byte order
         * from the given byte array.
         *
         * @param bytes - Source of bytes.
         * @param index - Offset for reading.
         */
        function readUint32FromByteArray(bytes, index) {
            if (typeof index === "undefined") {
                index = 0;
            }
            let value = 0;
            for (let i = index; i < index + 4; i++) {
                value <<= 8;
                value |= bytes[i];
            }
            return value >>> 0;
        }
        base.readUint32FromByteArray = readUint32FromByteArray;
        /**
         * Writes a 32-bit integer in little-endian byte order.
         *
         * @param destination - Destination of result.
         * @param value - Value to write.
         * @param index - Offset for writing.
         */
        function setUint32ToByteArray(destination, value, index) {
            for (let i = index + 3; i >= index; i--) {
                destination[i] = value & 0xFF;
                value >>= 8;
            }
        }
        base.setUint32ToByteArray = setUint32ToByteArray;
        /**
         * Reads a 16-bit integer in little-endian byte order
         * from the given byte array.
         *
         * @param bytes - Source of bytes.
         * @param index - Offset for reading.
         */
        function readUint16FromByteArray(bytes, index) {
            if (typeof index === "undefined") {
                index = 0;
            }
            let value = 0;
            for (let i = index; i < index + 2; i++) {
                value <<= 8;
                value |= bytes[i];
            }
            return value >>> 0;
        }
        base.readUint16FromByteArray = readUint16FromByteArray;
        /**
         * Writes a 16-bit integer in little-endian byte order.
         *
         * @param destination - Destination of result.
         * @param value - Value to write.
         * @param index - Offset for writing.
         */
        function setUint16ToByteArray(destination, value, index) {
            for (let i = index + 1; i >= index; i--) {
                destination[i] = value & 0xFF;
                value >>= 8;
            }
        }
        base.setUint16ToByteArray = setUint16ToByteArray;
    })(base = verificatum.base || (verificatum.base = {}));
    let arithm;
    (function(arithm) {
        let uli;
        (function(uli) {
            var byteArrayToHex = verificatum.base.byteArrayToHex;
            var change_wordsize = verificatum.base.change_wordsize;
            var hexToByteArray = verificatum.base.hexToByteArray;
            /**
             * Provides the core large integer arithmetic routines needed to
             * implement multiplicative groups and elliptic curve groups over
             * prime order fields. No additional functionality is provided.
             * Although the main goal of this module is to be well-documented and
             * clearly structured with proper encapsulation and without hidden
             * assumptions, this is quite hard in a few routines.
             *
             * <p>
             *
             * WARNING! This module must be used with care due to the assumptions
             * made by routines on inputs, but these assumptions are stated
             * explicitly for each function, so the code is easy to follow.
             *
             * <p>
             *
             * Integers are represented as arrays of numbers constrained to
             * WORDSIZE bits, where WORDSIZE is any even number between 4 and 30
             * and there are hardcoded constants derived from this when the script
             * is generated, so do not attempt to change the wordsize in the
             * generated code. These wordsizes are natural since JavaScript only
             * allows bit operations on 32-bit signed integers. To see this, note
             * that although we can do arithmetic on floating point numbers, e.g.,
             * by setting WORDSIZE = 24 we could do multiplications directly, it
             * is expensive to recover parts of the result. Bit operations on
             * 32-bit integers are provided in Javascript, but they are
             * implemented on top of the native "number" datatype, i.e., numbers
             * are cast to 32-bit signed integers, the bit operation is applied,
             * and the result is cast back to a "number".
             *
             * <p>
             *
             * Using small wordsizes exposes certain types of arithmetic bugs, so
             * providing this is not merely for educational purposes, it is also
             * to lower the risk of structural bugs.
             *
             * <p>
             *
             * Functions are only implemented for unsigned integers and when
             * called from external functions they assume that any result
             * parameter is of a given length. All arithmetic functions guarantee
             * that any leading unused words are set to zero.
             *
             * <p>
             *
             * A "limb" is an element of an array that may or may not store any
             * single-precision integer. A word is a limb containing data, which
             * may be zero if there are limbs at higher indices holding
             * data. Thus, the number of limbs is the length of an array and the
             * number of words is the index of the most significant word in the
             * array plus one.
             *
             * <p>
             *
             * The workhorse routine is muladd_loop() which is generated for a
             * given fixed wordsize. This routine determines the speed of
             * multiplication and squaring. To a large extent it also determines
             * the speed of division, but here div3by2() also plays an important
             * role. These routines are generated from M4 macro code to allow
             * using hard coded wordsize dependent constants for increased
             * speed. The square_naive() routine also contains some generated
             * code.
             *
             * <p>
             *
             * JavaScript is inherently difficult to optimize, since the
             * JavaScript engines are moving targets, but it seems that the
             * built-in arrays in Javascript are faster than the new typed arrays
             * if they are handled properly. A first version of the library was
             * based on Uint32Array for which, e.g., allocation of a fixed-size
             * array is slower than a builtin array.
             *
             * <p>
             *
             * One notable observation is that it sometimes makes sense to inform
             * the interpreter that a JavaScript "number" / float is really a
             * 32-bit integer by saying, e.g., (x | 0) even if we are guaranteed
             * that x is a 32-bit integer. This is important when accessing
             * elements from arrays and it seems to prevent the interpreter from
             * converting to and from floats.
             *
             * <p>
             *
             * We avoid dynamic memory allocation almost entirely by keeping
             * scratch space as static variables of the functions. This is
             * implemented using immediate function evaluation in JavaScript, but
             * it is encapsulated to reduce complexity, i.e., calling functions
             * remain unaware of this. This approach works well in our
             * applications, since higher level routines work with integers of
             * fixed bit length;
             *
             * <p>
             *
             * <a href="http://cacr.uwaterloo.ca/hac">Handbook of Cryptography
             * (HAC), Alfred J. Menezes, Paul C. van Oorschot and Scott
             * A. Vanstone</a> gives a straightforward introduction to the basic
             * algorithms used and we try to follow their notation for easy
             * reference. Division exploits the techniques of <a
             * href="http://lkk.lysator.liu.se/~nisse/archive/draft-division-paper.pdf">
             * Improved division by invariant integers, Niels Moller and Torbjorn
             * Granlund (MG)</a>. This is needed to implement div3by2() efficiently.
             *
             * <p>
             *
             * <table style="text-align: left;">
             * <tr><th>Reference        </th><th> Operation</th><th> Comment</th></tr>
             * <tr><td>HAC 14.7.        </td><td> Addition</td><td></td></tr>
             * <tr><td>HAC 14.9.        </td><td> Subtraction</td><td></td></tr>
             * <tr><td>HAC 14.12.       </td><td> Multiplication</td><td> Uses Karatsuba.</td></tr>
             * <tr><td>HAC 14.16.       </td><td> Squaring</td><td> Uses Karatsuba.</td></tr>
             * <tr><td>HAC 14.20 and MG.</td><td> Division.</td><td> Uses reciprocals for invariant moduli.</td></tr>
             * <tr><td>HAC 14.83.       </td><td> Modular exponentiation</td><td> Left-to-right k-ary.</td></tr>
             * </table>
             * TSDOC_MODULE
             */
            // Removed WASM code here.
            // Enabled TypeScript code starts here.
            // Enabled TypeScript code ends here
            // ################### Constants ########################################
            /**
             * Wordsize in bits, i.e., the number of bits stored in each "number"
             * which make up a big integer.
             */
            uli.WORDSIZE = 28;
            // Size threshold for using Karatsuba in multiplication.
            const KARATSUBA_MUL_THRESHOLD = 24;
            // Size threshold for using Karatsuba in squaring.
            const KARATSUBA_SQR_THRESHOLD = 35;
            // Threshold for relative difference in size for using Karatsuba in
            // multiplication.
            const KARATSUBA_RELATIVE = 0.8;
            // Removed WASM code here.
            // Enabled TypeScript code starts here.
            /**
             * Indicates if WebAssembly is enabled or not.
             */
            uli.wasm = false;
            /**
             * This is a placeholder to allow seamless optional embedding of WASM
             * code.
             */
            function initialize() {
                return;
            }
            uli.initialize = initialize;
            // Enabled TypeScript code ends here
            /**
             * Sets x = 0.
             *
             * @param x - Array to modify.
             */
            function setzero(x) {
                for (let i = 0; i < x.length; i++) {
                    x[i] = 0;
                }
            }
            uli.setzero = setzero;

            function set(w, x) {
                if (typeof x === "number") {
                    setzero(w);
                    w[0] = x & 0xfffffff;
                } else {
                    let i = 0;
                    while (i < Math.min(w.length, x.length)) {
                        w[i] = x[i];
                        i++;
                    }
                    while (i < w.length) {
                        w[i] = 0;
                        i++;
                    }
                }
            }
            uli.set = set;
            /**
             * Allocates new array of the given length where all
             * elements are zero.
             *
             * @param len - Length of array.
             * @returns Array of the given length where all elements are zero.
             */
            function newarray(len) {
                const x = [];
                x.length = len;
                setzero(x);
                return x;
            }
            uli.newarray = newarray;
            /**
             * Returns a copy of the given array.
             *
             * @param x - Original array.
             * @param len - Maximal length of copy.
             * @returns Copy of original array.
             */
            function copyarray(x, len) {
                if (typeof len === "undefined") {
                    len = 0;
                }
                const w = newarray(Math.max(x.length, len));
                set(w, x);
                return w;
            }
            uli.copyarray = copyarray;
            /**
             * Resizes the array to the given number of limbs,
             * either by truncating or by adding leading zero words.
             *
             * @param x - Original array.
             * @param len - New length.
             */
            function resize(x, len) {
                const xlen = x.length;
                x.length = len;
                if (len > xlen) {
                    for (let i = xlen; i < len; i++) {
                        x[i] = 0;
                    }
                }
            }
            uli.resize = resize;
            /**
             * Truncates the input to the shortest possible array
             * that represents the same absolute value in two's complement, i.e.,
             * there is always a leading zero bit.
             *
             * @param x - Array to truncate.
             * @param mask_top - Mask for a given wordsize with only most
             * significant bit set.
             */
            function normalize(x, mask_top = 0x8000000) {
                let l = x.length - 1;
                // There may be zeros to truncate.
                if (x[l] === 0) {
                    // Find index of most significant non-zero word.
                    while (l > 0 && x[l] === 0) {
                        l--;
                    }
                    // If most significant bit of this word is set, then we keep a
                    // leading zero word.
                    if ((x[l] & mask_top) !== 0) {
                        l++;
                    }
                    x.length = l + 1;
                    // We need to add a zero word to turn it into a positive integer
                    // in two's complement.
                } else if ((x[l] & mask_top) !== 0) {
                    x.length++;
                    x[x.length - 1] = 0;
                }
            }
            uli.normalize = normalize;
            /**
             * Sets x = 1.
             *
             * @param x - Array to modify.
             */
            function setone(x) {
                setzero(x);
                x[0] = 1;
            }
            uli.setone = setone;
            /**
             * Returns the index of the most significant bit in x.
             *
             * @param x - Array containing bit.
             * @returns An index i such that 0 <= i < x.length * 28.
             */
            function msbit(x) {
                for (let i = x.length - 1; i >= 0; i--) {
                    // Find index of most significant word.
                    if (x[i] !== 0) {
                        // Find index of most significant bit within the most
                        // significant word.
                        let msbit = (i + 1) * 28 - 1;
                        for (let mask = 0x8000000; mask !== 0; mask >>>= 1) {
                            if ((x[i] & mask) === 0) {
                                msbit--;
                            } else {
                                return msbit;
                            }
                        }
                    }
                }
                return 0;
            }
            uli.msbit = msbit;
            /**
             * Returns the lowest index of a set bit in the input or
             * zero if the input is zero.
             *
             * @param Array - containing bit.
             * @returns An index i such that 0 <= i < x.length * 28.
             */
            function lsbit(x) {
                let i = 0;
                while (i < x.length && x[i] === 0) {
                    i++;
                }
                if (i === x.length) {
                    return 0;
                } else {
                    let j = 0;
                    while ((x[i] >>> j & 0x1) === 0) {
                        j++;
                    }
                    return i * 28 + j;
                }
            }
            uli.lsbit = lsbit;
            /**
             * Returns the array index of the most significant word.
             *
             * @param x - Array containing word.
             * @returns An index i such that 0 <= i < x.length.
             */
            function msword(x) {
                for (let i = x.length - 1; i > 0; i--) {
                    if (x[i] !== 0) {
                        return i;
                    }
                }
                return 0;
            }
            uli.msword = msword;
            /**
             * Returns 1 or 0 depending on if the given bit is set or
             * not. Accessing a bit outside the number of limbs returns zero.
             *
             * @param x - Array containing bit.
             * @param index - Index of bit.
             * @returns Bit as a "number" at the given position.
             */
            function getbit(x, index) {
                const wordIndex = Math.floor(index / 28);
                const bitIndex = index % 28;
                if (wordIndex >= x.length) {
                    return 0;
                }
                if ((x[wordIndex] & 1 << bitIndex) === 0) {
                    return 0;
                } else {
                    return 1;
                }
            }
            uli.getbit = getbit;
            /**
             * Checks if the input represents the zero integer.
             *
             * @param x - Array to inspect.
             * @returns True or false depending on if x represents zero or not.
             */
            function iszero(x) {
                for (let i = 0; i < x.length; i++) {
                    if (x[i] !== 0) {
                        return false;
                    }
                }
                return true;
            }
            uli.iszero = iszero;
            /**
             * Returns -1, 0, or 1 depending on if x < y, x == y, or
             * x > y.
             *
             * <p>
             *
             * ASSUMES: x and y are positive.
             *
             * @param x - Left array.
             * @param x - Right array.
             * @returns Sign of comparison relation.
             */
            function cmp(x, y) {
                // Make sure that x has at least as many words as y does, and
                // remember if we swapped them to correct the sign at the end.
                let sign = 1;
                if (x.length < y.length) {
                    const t = x;
                    x = y;
                    y = t;
                    sign = -1;
                }
                let i = x.length - 1;
                while (i >= y.length) {
                    if (x[i] === 0) {
                        i--;
                    } else {
                        return sign;
                    }
                }
                while (i >= 0) {
                    if (x[i] > y[i]) {
                        return sign;
                    } else if (x[i] < y[i]) {
                        return -sign;
                    }
                    i--;
                }
                return 0;
            }
            uli.cmp = cmp;
            /**
             * Shifts the given number of bits within the array,
             * i.e., the allocated space is not expanded.
             *
             * <p>
             *
             * ASSUMES: offset >= 0.
             *
             * @param x - Array to be shifted.
             * @param offset - Number of bit positions to shift.
             */
            function shiftleft(x, offset) {
                // No shifting.
                if (offset === 0) {
                    return;
                }
                // Too much shifting.
                if (offset >= x.length * 28) {
                    setzero(x);
                    return;
                }
                // Left shift words.
                const wordOffset = Math.floor(offset / 28);
                if (wordOffset > 0) {
                    let j = x.length - 1;
                    while (j >= wordOffset) {
                        x[j] = x[j - wordOffset];
                        j--;
                    }
                    while (j >= 0) {
                        x[j] = 0;
                        j--;
                    }
                }
                // Left shift bits within words.
                const bitOffset = offset % 28;
                const negBitOffset = 28 - bitOffset;
                if (bitOffset !== 0) {
                    for (let i = x.length - 1; i > 0; i--) {
                        const left = x[i] << bitOffset & 0xfffffff;
                        const right = x[i - 1] >>> negBitOffset;
                        x[i] = left | right;
                    }
                    x[0] = x[0] << bitOffset & 0xfffffff;
                }
            }
            uli.shiftleft = shiftleft;
            /**
             * Shifts the given number of bits to the right within
             * the allocated space, i.e., the space is not reduced.
             *
             * <p>
             *
             * ASSUMES: offset >= 0.
             *
             * @param x - Array to be shifted.
             * @param offset - Number of bit positions to shift.
             */
            function shiftright(x, offset) {
                // No shifting.
                if (offset === 0) {
                    return;
                }
                // Too much shifting.
                if (offset >= x.length * 28) {
                    setzero(x);
                    return;
                }
                // Right shift words.
                const wordOffset = Math.floor(offset / 28);
                if (wordOffset > 0) {
                    let j = 0;
                    while (j < x.length - wordOffset) {
                        x[j] = x[j + wordOffset];
                        j++;
                    }
                    while (j < x.length) {
                        x[j] = 0;
                        j++;
                    }
                }
                // Right shift bits within words.
                const bitOffset = offset % 28;
                const negBitOffset = 28 - bitOffset;
                if (bitOffset !== 0) {
                    for (let i = 0; i < x.length - 1; i++) {
                        const left = x[i] >>> bitOffset;
                        const right = x[i + 1] << negBitOffset & 0xfffffff;
                        x[i] = left | right;
                    }
                    x[x.length - 1] = x[x.length - 1] >>> bitOffset;
                }
            }
            uli.shiftright = shiftright;
            /**
             * Sets w = x + y.
             *
             * <p>
             *
             * ASSUMES: x and y are positive and have B and B' bits and w can
             * store (B + B' + 1) bits. A natural choice in general is to let w
             * have (L + L' + 1) limbs if x and y have L and L' limbs, but the
             * number of limbs can be arbitrary.
             *
             * <p>
             *
             * References: HAC 14.7.
             *
             * @param w - Array holding the result.
             * @param x - Left term.
             * @param y - Right term.
             */
            function add(w, x, y) {
                let tmp;
                let c = 0;
                // Make sure that x is at least as long as y.
                if (x.length < y.length) {
                    const t = x;
                    x = y;
                    y = t;
                }
                // Add words of x and y with carry.
                let i = 0;
                let len = Math.min(w.length, y.length);
                while (i < len) {
                    tmp = x[i] + y[i] + c;
                    w[i] = tmp & 0xfffffff;
                    c = tmp >> 28;
                    i++;
                }
                // Add x and carry.
                len = Math.min(w.length, x.length);
                while (i < len) {
                    tmp = x[i] + c;
                    w[i] = tmp & 0xfffffff;
                    c = tmp >> 28;
                    i++;
                }
                // Set carry and clear the rest.
                if (i < w.length) {
                    w[i] = c;
                    i++;
                }
                while (i < w.length) {
                    w[i] = 0;
                    i++;
                }
            }
            uli.add = add;
            /* eslint-disable no-extra-parens */
            /**
             * Sets w to the negative of x in two's complement
             * representation using L * 28 bits, where L is the number of
             * limbs in w.
             *
             * <p>
             *
             * ASSUMES: w has at least as many limbs as x.
             *
             * @param w - Array holding the result.
             * @param x - Integer.
             */
            function neg(w, x) {
                let tmp;
                let c = 1;
                let i = 0;
                while (i < x.length) {
                    tmp = (x[i] ^ 0xfffffff) + c;
                    w[i] = tmp & 0xfffffff;
                    c = (tmp >> 28) & 0xfffffff;
                    i++;
                }
                while (i < w.length) {
                    tmp = 0xfffffff + c;
                    w[i] = tmp & 0xfffffff;
                    c = (tmp >> 28) & 0xfffffff;
                    i++;
                }
            }
            uli.neg = neg;
            /* eslint-enable no-extra-parens */
            /**
             * Sets w = x - y if x >= y and otherwise it simply
             * propagates -1, i.e., 0xfffffff, through the remaining words of
             * w.
             *
             * <p>
             *
             * ASSUMES: for normal use x >= y, and x and y have B and B' bits and
             * w can store B bits. A natural choice is to use L >= L' limbs for x
             * and y respectively and L limbs for w, but the number of limbs can
             * be arbitrary.
             *
             * <p>
             *
             * References: HAC 14.9.
             *
             * @param w - Array holding the result.
             * @param x - Left term.
             * @param y - Right term.
             * @returns Finally carry.
             */
            function sub(w, x, y) {
                let tmp = 0;
                let c = 0;
                // Subtract words of x and y with carry.
                let len = Math.min(w.length, x.length, y.length);
                let i = 0;
                while (i < len) {
                    tmp = x[i] - y[i] + c;
                    w[i] = tmp & 0xfffffff;
                    c = tmp >> 28;
                    i++;
                }
                // Propagate carry along with one of x and y.
                if (x.length > y.length) {
                    len = Math.min(w.length, x.length);
                    while (i < len) {
                        tmp = x[i] + c;
                        w[i] = tmp & 0xfffffff;
                        c = tmp >> 28;
                        i++;
                    }
                } else {
                    len = Math.min(w.length, y.length);
                    while (i < len) {
                        tmp = -y[i] + c;
                        w[i] = tmp & 0xfffffff;
                        c = tmp >> 28;
                        i++;
                    }
                }
                // Propagate carry.
                while (i < w.length) {
                    w[i] = c & 0xfffffff;
                    c = tmp >> 28;
                    i++;
                }
                return c;
            }
            uli.sub = sub;
            // Enabled TypeScript code starts here.
            /**
             * Specialized implementation of muladd_loop() for
             * 28-bit words. This is essentially a naive
             * double-precision multiplication computation done in a loop. This
             * code is quite sensitive to replacing the constants with variables,
             * which explains why it is generated from source with macros. Using
             * two's complement for temporary values this can be used as a
             * "mulsub_loop" as well.
             *
             * <p>
             *
             * Computes (pseudo-code) that due to limited precision and 32-bit
             * bound bit operations does not work in JavaScript:
             *
             * <pre>
             * for (var j = start; j < end; j++) {
             *     tmp = x[j] * Y + w[i + j] + c;
             *     w[i + j] = tmp & 0xfffffff;
             *     c = tmp >>> 28;
             * }
             * return c;
             * </pre>
             *
             * <p>
             *
             * Note that if Y < 2^(28 + 1), then the output carry c is
             * only guaranteed to be smaller than 2^(28 + 1), which does
             * not fit into a word.
             *
             * <p>
             *
             * ASSUMES: Y < 2^(28 + 1).
             *
             * @param w - Array holding additive terms as input and the output.
             * @param x - Array to be scaled.
             * @param start - Start index into x.
             * @param end - End index into x.
             * @param Y - Scalar.
             * @param i - Index into w.
             * @param c - Input carry.
             * @returns Finally carry.
             */
            /* eslint-disable prefer-const */
            function muladd_loop(w, x, start, end, Y, i, c) {
                // Temporary variables in muladd.
                let hx;
                let lx;
                let cross;
                // Extract upper and lower halves of Y.
                const hy = (Y >>> 14);
                const ly = (Y & 0x3fff);
                // This implies:
                // hy < 2^(14 + 1)
                // ly < 2^14
                // The invariant of the loop is c < 2^(28 + 1).
                for (let j = start; j < end; j++) {
                    // M4_WORD_MULADD2
                    // Extract upper half of x.
                    hx = (x[j] >>> 14);
                    // Extract lower half of x.
                    lx = (x[j] & 0x3fff);
                    // This implies:
                    // hx < 2^14
                    // lx < 2^14
                    // Compute the sum of the cross terms.
                    cross = (hx * ly + lx * hy) | 0;
                    // This implies:
                    // cross < 2^(28 + 2)
                    // Partial computation from which the lower word can be
                    // extracted.
                    lx = (((w[j + i] | 0) + lx * ly + ((cross & 0x3fff) << 14)) | 0) + c;
                    // This implies: so we can safely use bit operator on lx.
                    // lx < 2^(28 + 2)
                    // Complete the computation of the higher bits.
                    c = ((lx >>> 28) + hx * hy + (cross >>> 14)) | 0;
                    // Extract the lower word of x * y.
                    w[j + i] = lx & 0xfffffff;
                }
                // This is a (28 + 1)-bit word when Y is.
                return c;
            }
            uli.muladd_loop = muladd_loop;
            /* eslint-enable prefer-const */
            // Enabled TypeScript code ends here
            /**
             * Sets w = x * y, where w has two limbs and x and y are words. This
             * is specialized similarly to muladd_loop and generated using the
             * same macro.
             *
             * @param w - Destination long.
             * @param x - Single word factor.
             * @param y - Single word factor.
             */
            /* eslint-disable prefer-const */
            function word_mul(w, x, y) {
                let hx;
                let lx;
                let cross;
                // Clear the result, since we are muladding.
                w[0] = 0;
                w[1] = 0;
                // Extract upper and lower halves of y.
                const hy = (y >>> 14);
                const ly = (y & 0x3fff);
                // M4_WORD_MULADD2
                // Extract upper half of x.
                hx = (x >>> 14);
                // Extract lower half of x.
                lx = (x & 0x3fff);
                // This implies:
                // hx < 2^14
                // lx < 2^14
                // Compute the sum of the cross terms.
                cross = (hx * ly + lx * hy) | 0;
                // This implies:
                // cross < 2^(28 + 2)
                // Partial computation from which the lower word can be
                // extracted.
                lx = (((w[0] | 0) + lx * ly + ((cross & 0x3fff) << 14)) | 0) + w[1];
                // This implies: so we can safely use bit operator on lx.
                // lx < 2^(28 + 2)
                // Complete the computation of the higher bits.
                w[1] = ((lx >>> 28) + hx * hy + (cross >>> 14)) | 0;
                // Extract the lower word of x * y.
                w[0] = lx & 0xfffffff;
            }
            uli.word_mul = word_mul;
            /* eslint-enable prefer-const */
            /* eslint-disable no-extra-parens */
            /**
             * Sets w = x * x.
             *
             * <p>
             *
             * ASSUMES: x is non-negative with L and L' limbs respectively, and
             * that w has at least L + L' limbs.
             *
             * <p>
             *
             * References: HAC 14.16.
             *
             * @param w - Array holding the result.
             * @param x - Factor.
             */
            function square_naive(w, x) {
                const n = msword(x) + 1;
                let c;
                let sc = 0;
                setzero(w);
                let i = 0;
                while (i < n) {
                    // This computes
                    // (c, w[2 * i]) = w[2 * i] + x[i] * x[i],
                    // where the result is interpreted as a pair of integers of
                    // sizes (28 + 1, 28):
                    let l = x[i] & 0x3fff;
                    const h = x[i] >>> 14;
                    const cross = l * h << 1;
                    // This implies:
                    // l, h < 2^14
                    // cross < 2^(28 + 1)
                    l = (w[i << 1] | 0) + l * l +
                        ((cross & 0x3fff) << 14);
                    // This implies, so we can safely use bit operators on l;
                    // l < 2^(28 + 2)
                    c = ((l >>> 28) + (cross >>> 14) + h * h) | 0;
                    w[i << 1] = l & 0xfffffff;
                    // This implies, which is a requirement for the loop.
                    // c < 2^(28 + 1)
                    //
                    // The standard way to do this would be to simply allow each
                    // w[i + n] to intermittently hold a WORDSIZE + 1 bit integer
                    // (or overflow register), but for 30-bit words this causes
                    // overflow in muladd_loop.
                    sc = muladd_loop(w, x, i + 1, n, x[i] << 1, i, c) + sc;
                    w[i + n] = sc & 0xfffffff;
                    sc >>>= 28;
                    i++;
                }
            }
            uli.square_naive = square_naive;
            /* eslint-enable no-extra-parens */
            /**
             * Splits x into two parts l and h of equal and
             * predetermined size, i.e., the lengths of the lists l and h
             * determines how x is split.
             *
             * @param l - Array holding most significant words of x.
             * @param h - Array holding most significant words of x.
             * @param x - Original array.
             */
            function karatsuba_split(l, h, x) {
                const m = Math.min(l.length, x.length);
                let i = 0;
                while (i < m) {
                    l[i] = x[i];
                    i++;
                }
                while (i < l.length) {
                    l[i] = 0;
                    i++;
                }
                while (i < x.length) {
                    h[i - l.length] = x[i];
                    i++;
                }
                i -= l.length;
                while (i < l.length) {
                    h[i] = 0;
                    i++;
                }
            }
            /**
             * Sets w = x * x. The depth parameter determines the
             * recursive depth of function calls and must be less than 3.
             *
             * <p>
             *
             * ASSUMES: x is non-negative and has L limbs and w has at least 2 * L
             * limbs.
             *
             * <p>
             *
             * References: HAC <sectionsign>14.2,
             * https://en.wikipedia.org/wiki/Karatsuba_algorithm
             *
             * @param w - Array holding the result.
             * @param x - Factor.
             * @param depth - Recursion depth of the Karatsuba algorithm.
             */
            uli.square_karatsuba = (function() {
                // Scratch space indexed by depth. These arrays are resized as
                // needed in each call. In typical cryptographic applications big
                // integers have the same size, so no resize takes place.
                const scratch = [
                    [
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        []
                    ],
                    [
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        []
                    ],
                    [
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        []
                    ]
                ];
                return function(w, x, depth, len) {
                    // Access scratch space of this depth. Due to the depth-first
                    // structure of this algorithm no overwriting can take place.
                    const s = scratch[depth];
                    const h = s[0];
                    const l = s[1];
                    const z2 = s[2];
                    const z1 = s[3];
                    const z0 = s[4];
                    const xdif = s[5];
                    // Make sure that the arrays have proper sizes.
                    if (typeof len === "undefined") {
                        len = x.length;
                    }
                    len += len % 2;
                    const half_len = len >>> 1;
                    if (h.length !== half_len) {
                        resize(h, half_len);
                        resize(l, half_len);
                        resize(z2, len);
                        resize(z1, len);
                        resize(z0, len);
                        resize(xdif, half_len);
                    }
                    // Split the input x into higher and lower parts.
                    karatsuba_split(l, h, x);
                    if (depth < 1) {
                        square_naive(z2, h);
                        square_naive(z0, l);
                    } else {
                        uli.square_karatsuba(z2, h, depth - 1);
                        uli.square_karatsuba(z0, l, depth - 1);
                    }
                    // We guess which is bigger and correct the result if needed.
                    if (sub(xdif, h, l) < 0) {
                        sub(xdif, l, h);
                    }
                    if (depth < 1) {
                        square_naive(z1, xdif);
                    } else {
                        uli.square_karatsuba(z1, xdif, depth - 1);
                    }
                    // Specialized loop to compute:
                    // b^2 * z2 + b * (z0 - z1 + z2) + z0
                    // where b = 2^(half_len * 28). We do it as follows:
                    // w = b^2 * z2 + b * (z0 + z2) + z0
                    // w = w - b * z1
                    const l0 = Math.min(w.length, half_len);
                    const l1 = Math.min(w.length, len);
                    const l2 = Math.min(w.length, len + half_len);
                    const l3 = Math.min(w.length, 2 * len);
                    const l4 = Math.min(w.length, len + half_len);
                    const l5 = Math.min(w.length, 2 * len);
                    let tmp;
                    let c = 0;
                    let i = 0;
                    while (i < l0) {
                        w[i] = z0[i];
                        i++;
                    }
                    while (i < l1) {
                        tmp = z0[i] + z0[i - half_len] + z2[i - half_len] + c;
                        // This implies, so we can safely add within 32 bits using
                        // unsigned left shift.
                        // tmp < 2^{28 + 2}
                        w[i] = tmp & 0xfffffff;
                        c = tmp >>> 28;
                        i++;
                    }
                    while (i < l2) {
                        tmp = z0[i - half_len] + z2[i - half_len] + z2[i - len] + c;
                        // This implies, so we can safely add within 32 bits using
                        // unsigned left shift.
                        // tmp < 2^(28 + 2)
                        w[i] = tmp & 0xfffffff;
                        c = tmp >>> 28;
                        i++;
                    }
                    while (i < l3) {
                        tmp = z2[i - len] + c;
                        w[i] = tmp & 0xfffffff;
                        c = tmp >>> 28;
                        i++;
                    }
                    // We can ignore the positive carry here, since we know that
                    // the final result fits within 2 * len words, but we need to
                    // subtract z1 at the right position.
                    i = half_len;
                    c = 0;
                    while (i < l4) {
                        tmp = w[i] - z1[i - half_len] + c;
                        w[i] = tmp & 0xfffffff;
                        c = tmp >> 28;
                        i++;
                    }
                    while (i < l5) {
                        tmp = w[i] + c;
                        w[i] = tmp & 0xfffffff;
                        c = tmp >> 28;
                        i++;
                    }
                    // Again, we ignore the carry.
                    // This guarantees that the result is correct even if w has
                    // more than L + L' words.
                    while (i < w.length) {
                        w[i] = 0;
                        i++;
                    }
                };
            })();
            /**
             * Sets w = x * x.
             *
             * <p>
             *
             * ASSUMES: x is non-negative with L and L' limbs respectively, and
             * that w has at least L + L' limbs.
             *
             * <p>
             *
             * References: HAC 14.16.
             *
             * @param w - Array holding the result.
             * @param x - Factor.
             * @param len - Actual lengths of inputs. Useful when stored in longer arrays.
             */
            function square(w, x, len) {
                // Only use Karatsuba if the inputs are big enough.
                const xlen = msword(x) + 1;
                if (xlen > KARATSUBA_SQR_THRESHOLD) {
                    uli.square_karatsuba(w, x, 0, len);
                } else {
                    square_naive(w, x);
                }
            }
            uli.square = square;
            /**
             * Sets w = x * y.
             *
             * <p>
             *
             * ASSUMES: x and y are both non-negative with L and L' limbs
             * respectively, and that w has at least L + L' limbs.
             *
             * <p>
             *
             * References: HAC 14.12.
             *
             * @param w - Array holding the result.
             * @param x - Left factor.
             * @param y - Right factor.
             */
            function mul_naive(w, x, y) {
                const n = msword(x) + 1;
                const t = msword(y) + 1;
                setzero(w);
                for (let i = 0; i < t; i++) {
                    w[i + n] =
                        muladd_loop(w, x, 0, n, y[i], i, 0);
                }
            }
            uli.mul_naive = mul_naive;
            /**
             * Sets w = x * y. The depth parameter determines the
             * recursive depth of function calls and must be less than 3.
             *
             * <p>
             *
             * ASSUMES: x and y are both non-negative, with L and L' limbs
             * respectively, and that w has at least L + L' limbs.
             *
             * <p>
             *
             * References: HAC <sectionsign>14.2,
             * https://en.wikipedia.org/wiki/Karatsuba_algorithm
             *
             * @param w - Array holding the result.
             * @param x - Left factor.
             * @param y - Right factor.
             * @param depth - Recursion depth of the Karatsuba algorithm.
             * @param len - Actual lengths of inputs. Useful when stored in longer arrays.
             */
            uli.mul_karatsuba = (function() {
                // Scratch space indexed by depth. These arrays are resized as
                // needed in each call. In typical cryptographic applications big
                // integers have the same size, so no resize takes place.
                const scratch = [
                    [
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        []
                    ],
                    [
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        []
                    ],
                    [
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        [],
                        []
                    ]
                ];
                return function(w, x, y, depth, len) {
                    // Access scratch space of this depth. Due to the depth-first
                    // structure of this algorithm no overwriting can take place.
                    const s = scratch[depth];
                    const hx = s[0];
                    const lx = s[1];
                    const hy = s[2];
                    const ly = s[3];
                    const z2 = s[4];
                    const z1 = s[5];
                    const z0 = s[6];
                    const xsum = s[7];
                    const ysum = s[8];
                    const tmp1 = s[9];
                    const tmp2 = s[10];
                    setzero(w);
                    // Make sure that the lengths of the arrays are equal and
                    // even.
                    if (typeof len === "undefined") {
                        len = Math.max(x.length, y.length);
                    }
                    len += len % 2;
                    const half_len = len >>> 1;
                    if (hx.length !== half_len) {
                        resize(hx, half_len);
                        resize(lx, half_len);
                        resize(hy, half_len);
                        resize(ly, half_len);
                        resize(z2, len);
                        resize(z1, len + 2);
                        resize(z0, len);
                        resize(xsum, half_len + 1);
                        resize(ysum, half_len + 1);
                        resize(tmp1, len + 2);
                        resize(tmp2, len + 2);
                    }
                    // Split the input x and y into higher and lower parts.
                    karatsuba_split(lx, hx, x);
                    karatsuba_split(ly, hy, y);
                    if (depth < 1) {
                        mul_naive(z2, hx, hy);
                        mul_naive(z0, lx, ly);
                    } else {
                        uli.mul_karatsuba(z2, hx, hy, depth - 1);
                        uli.mul_karatsuba(z0, lx, ly, depth - 1);
                    }
                    add(xsum, hx, lx);
                    add(ysum, hy, ly);
                    if (depth < 1) {
                        mul_naive(tmp1, xsum, ysum);
                    } else {
                        uli.mul_karatsuba(tmp1, xsum, ysum, depth - 1);
                    }
                    sub(tmp2, tmp1, z2);
                    sub(z1, tmp2, z0);
                    // Specialized loop to combine the results.
                    // Avoid increasing the length of w.
                    const l0 = Math.min(w.length, half_len);
                    const l1 = Math.min(w.length, len);
                    const l2 = Math.min(w.length, len + half_len + 2);
                    const l3 = Math.min(w.length, 2 * len);
                    let tmp;
                    let c = 0;
                    let i = 0;
                    while (i < l0) {
                        w[i] = z0[i];
                        i++;
                    }
                    while (i < l1) {
                        tmp = z0[i] + z1[i - half_len] + c;
                        w[i] = tmp & 0xfffffff;
                        c = tmp >>> 28;
                        i++;
                    }
                    while (i < l2) {
                        tmp = z1[i - half_len] + z2[i - len] + c;
                        w[i] = tmp & 0xfffffff;
                        c = tmp >>> 28;
                        i++;
                    }
                    while (i < l3) {
                        tmp = z2[i - len] + c;
                        w[i] = tmp & 0xfffffff;
                        c = tmp >>> 28;
                        i++;
                    }
                    // This guarantees that the result is correct even if w has more
                    // than L + L' words.
                    while (i < w.length) {
                        w[i] = 0;
                        i++;
                    }
                };
            })();
            /**
             * Sets w = x * y.
             *
             * <p>
             *
             * ASSUMES: x and y are both non-negative with L and L' limbs
             * respectively, and that w has at least L + L' limbs.
             *
             * @param w - Array holding the result.
             * @param x - Left factor.
             * @param y - Right factor.
             * @param len - Actual lengths of inputs. Useful when stored in longer arrays.
             */
            function mul(w, x, y, len) {
                if (x === y) {
                    square(w, x, len);
                } else {
                    // Only use Karatsuba if the inputs are big enough and
                    // relatively balanced.
                    const xlen = msword(x) + 1;
                    const ylen = msword(y) + 1;
                    if (xlen > KARATSUBA_MUL_THRESHOLD &&
                        Math.min(xlen / ylen, ylen / xlen) > KARATSUBA_RELATIVE) {
                        uli.mul_karatsuba(w, x, y, 0, len);
                    } else {
                        mul_naive(w, x, y);
                    }
                }
            }
            uli.mul = mul;
            /* eslint-disable no-extra-parens */
            /**
             * Computes the 2-by-1 reciprocal of a word d.
             *
             * <p>
             *
             * ASSUMES: most significant bit of d is set, i.e., we have
             * 2^28/2 <= d < 2^28.
             *
             * <p>
             *
             * References: Functionally equivalent to RECIPROCAL_WORD in MG.
             *
             * @param d - Normalized divisor.
             * @returns 2-by-1 reciprocal of d.
             */
            uli.reciprocal_word = (function() {
                // Temporary variables.
                const q = [0, 0];
                const a = [0, 0];
                const p = [0, 0, 0];
                const r = [0, 0, 0];
                const one = [1];
                const zero = [0];
                const dd = [0];
                const two_masks = [0xfffffff, 0xfffffff];
                return function(d) {
                    let s;
                    let N;
                    let A;
                    dd[0] = d;
                    set(r, two_masks);
                    setzero(q);
                    do {
                        // If r does not fit in a float, we shift it and the
                        // divisor before computing the estimated quotient.
                        s = Math.max(0, msbit(r) - 53);
                        N = r[1] * Math.pow(2, 28 - s) + (r[0] >> s);
                        A = Math.floor(N / d);
                        // Approximation of quotient as two-word integer.
                        a[0] = A & 0xfffffff;
                        a[1] = (A >>> 28);
                        shiftleft(a, s);
                        // p = a * d
                        mul(p, a, dd);
                        // Correct the estimate if needed. This should not happen,
                        // due to taking the floor, but floating point arithmetic
                        // is not robust over platforms, so let us be defensive.
                        while (cmp(p, r) > 0) {
                            sub(a, a, one);
                            sub(p, p, dd);
                        }
                        // r = r - q * d
                        sub(r, r, p);
                        add(q, q, a);
                    } while (cmp(a, zero) > 0);
                    // For code like this it is not robust to condition on r < d,
                    // since it is conceivable that A and hence a is zero despite
                    // that r > d. This turns out to not be the case here, but we
                    // write defensive code.
                    while (cmp(r, dd) >= 0) {
                        add(q, q, one);
                        sub(r, r, dd);
                    }
                    // q = q - 2^28
                    return q[0] & 0xfffffff;
                };
            })();
            /**
             * Computes the 3-by-2 reciprocal of d, where d has two
             * limbs/words.
             *
             * <p>
             *
             * ASSUMES: most significant bit of d is set, i.e., we have
             * 2^(2 * 28)/2 <= d < 2^(2*28).
             *
             * <p>
             *
             * References: Algorithm RECIPROCAL_WORD_3BY2 in MG.
             *
             * @param d - Normalized divisor.
             * @returns 3-by-2 reciprocal of d.
             */
            uli.reciprocal_word_3by2 = (function() {
                const t = [0, 0];
                return function(d) {
                    let v = uli.reciprocal_word(d[1]);
                    // p = d1 * v mod 2^28
                    word_mul(t, d[1], v);
                    let p = t[0];
                    // p = p + d0 mod 2^28
                    p = (p + d[0]) & 0xfffffff;
                    // p < d0
                    if (p < d[0]) {
                        v--;
                        // p >= d1
                        if (p >= d[1]) {
                            v--;
                            p = p - d[1];
                        }
                        p = (p + 0x10000000 - d[1]) & 0xfffffff;
                    }
                    // t = p * d0
                    word_mul(t, v, d[0]);
                    // p = p + t1 mod 2^28
                    p = (p + t[1]) & 0xfffffff;
                    if (p < t[1]) {
                        v--;
                        // (p,t0) >= (d1,d0)
                        if (p > d[1] || (p === d[1] && t[0] >= d[0])) {
                            v--;
                        }
                    }
                    return v;
                };
            })();
            /**
             * Computes q and r such that u = q * d + r, where d has
             * two limbs/words, d has three limbs/words, and 0 <= r < d.
             *
             * <p>
             *
             * ASSUMES: most significant bit of d is set, i.e., we have
             * 2^(2 * 28)/2 <= d < 2^(2*28).
             *
             * <p>
             *
             * References: Algorithm DIV3BY2 in MG.
             *
             * @param r - Two-word integer that ends up holding the remainder.
             * @param u - Three-word dividend.
             * @param d - Normalized divisor.
             * @param neg_d - Negative of d in two's complement.
             * @param v - 3by2 reciprocal of d.
             * @returns Integer quotient q = u / d.
             */
            uli.div3by2 = (function() {
                // Temporary variables.
                const q = [0, 0];
                const neg_t = [0, 0];
                return function(r, u, d, neg_d, v) {
                    let tmp = 0;
                    // (q1,q0) = v * u2
                    word_mul(q, v, u[2]);
                    // q = q + (u2,u1)
                    // M4_LONG_ADD2
                    tmp = q[0] + u[1];
                    q[0] = tmp & 0xfffffff;
                    q[1] = (q[1] + u[2] + (tmp >>> 28)) & 0xfffffff;
                    // r1 = u1 - q1 * d1 mod 2^28
                    word_mul(r, q[1], d[1]);
                    r[1] = (u[1] + 0x10000000 - r[0]) & 0xfffffff;
                    // neg_t = d0 * q1
                    word_mul(neg_t, d[0], q[1]);
                    neg(neg_t, neg_t);
                    // r = (r1,u0) - t - d mod 2^(2 * 28)
                    r[0] = u[0];
                    // M4_LONG_ADD2
                    tmp = r[0] + neg_t[0];
                    r[0] = tmp & 0xfffffff;
                    r[1] = (r[1] + neg_t[1] + (tmp >>> 28)) & 0xfffffff;
                    // M4_LONG_ADD2
                    tmp = r[0] + neg_d[0];
                    r[0] = tmp & 0xfffffff;
                    r[1] = (r[1] + neg_d[1] + (tmp >>> 28)) & 0xfffffff;
                    // q1 = q1 + 1 mod 2^28
                    q[1] = (q[1] + 1) & 0xfffffff;
                    // r1 >= q0
                    if (r[1] >= q[0]) {
                        // q1 = q1 - 1 mod 2^28
                        q[1] = (q[1] + 0xfffffff) & 0xfffffff;
                        // r = r + d mod 2^(2 * 28)
                        // M4_LONG_ADD2
                        tmp = r[0] + d[0];
                        r[0] = tmp & 0xfffffff;
                        r[1] = (r[1] + d[1] + (tmp >>> 28)) & 0xfffffff;
                    }
                    // r >= d
                    if (r[1] > d[1] || (r[1] === d[1] && r[0] >= d[0])) {
                        // q1 = q1 + 1
                        q[1] = q[1] + 1;
                        // r = r - d
                        // M4_LONG_ADD2
                        tmp = r[0] + neg_d[0];
                        r[0] = tmp & 0xfffffff;
                        r[1] = (r[1] + neg_d[1] + (tmp >>> 28)) & 0xfffffff;
                    }
                    return q[1];
                };
            })();
            /* eslint-enable no-extra-parens */
            /**
             * Sets q and r such that x = qy + r, except that r is
             * computed in place of x, so at the end of the execution x is
             * identified with r. WARNING! y is cached in its normalized form
             * along with its negation and reciprocal. This is pointer based,
             * i.e., it is assumed that the contents of y do not change. High
             * level routines must accomodate.
             *
             * <p>
             *
             * ASSUMES: x and y are positive, x has L words and at least L + 2
             * limbs (i.e., two leading unused zero words), y has L' words, and q
             * has at least L'' = max{L - L', 0} + 1 limbs and will finally hold
             * a result with at most L'' words and a leading zero limb.
             *
             * <p>
             *
             * References: HAC 14.20.
             *
             * @param q - Holder of quotient.
             * @param x - Divident and holder of remainder at end of computation.
             * @param y - Divisor.
             */
            /* eslint-disable sonarjs/cognitive-complexity */
            uli.div_qr = (function() {
                // y from the previous call.
                let old_y = [];
                // Normalized y.
                const ny = [];
                // Negative of normalized y.
                const neg_ny = [];
                // Bits shifted left to normalize.
                let normdist;
                // Index of most significant word of ny.
                let t;
                // Reciprocal for 3by2 division.
                let v;
                // Most significant 3 words of x shifted to accomodate for the
                // normalization of y.
                const u = [0, 0, 0];
                // Top two words of ny.
                const d = [0, 0];
                // Negative of d in two's complement.
                const neg_d = [0, 0];
                // Remainder in 3by2 division.
                const r = [0, 0];
                // Normalizes y and computes reciprocals.
                const initialize_y = function(y) {
                    if (y === old_y) {
                        return;
                    }
                    old_y = y;
                    // Make sure we have room for a normalized copy ny of y and a
                    // negative of ny.
                    if (neg_ny.length !== y.length + 1) {
                        resize(neg_ny, y.length + 1);
                        ny.length = y.length;
                    }
                    // Make copy of y.
                    set(ny, y);
                    // Determine a normalization distance.
                    normdist = (28 - (msbit(ny) + 1) % 28) % 28;
                    shiftleft(ny, normdist);
                    // Compute the negative of ny in two's complement, but drop
                    // the carry that equals -1 in the end. Note that neg_ny has
                    // one more limb than ny, which is safe since the carry is
                    // not used.
                    neg(neg_ny, ny);
                    // Index of most significant word of ny.
                    t = msword(ny);
                    // Extract top two words of y and their negative.
                    d[1] = ny[t];
                    d[0] = t > 0 ? ny[t - 1] : 0;
                    neg(neg_d, d);
                    // Sets the reciprocal of d.
                    v = uli.reciprocal_word_3by2(d);
                };
                // Returns true or false depending on if x >= s(y) or not, where
                // s(y) = y * 2^((n - t) * 28), i.e., s(y) is y shifted by
                // n - t words to the left, and n and t are the indices of the
                // most significant words of x and y respectively.
                const shiftleft_ge = function(x, n, y, t) {
                    let i = n;
                    let j = t;
                    while (j >= 0) {
                        if (x[i] > y[j]) {
                            return true;
                        } else if (x[i] < y[j]) {
                            return false;
                        }
                        i--;
                        j--;
                    }
                    // When the top t + 1 words of x and s(y) are identical, we
                    // would compare the remaining (n + 1) - (t + 1) = n - 1
                    // words, but the bottom offset words of s(y) are zero, so in
                    // this case x >= s(y).
                    return true;
                };
                return function(w, x, y) {
                    let i;
                    let j;
                    let k;
                    let l;
                    let tmp;
                    let c;
                    // Set quotient to zero.
                    setzero(w);
                    // If x < y, then simply return.
                    if (cmp(x, y) < 0) {
                        return;
                    }
                    // Initialize division with y. Normalization, reciprocals etc.
                    initialize_y(y);
                    // Left shift x to accomodate for normalization of y.
                    shiftleft(x, normdist);
                    // Index of most significant word of x.
                    const n = msword(x);
                    // Since x > ny, we know that n >= t > 0. Pseudo-code:
                    //
                    // while (x >= ny * 2^((n - t) * wordsize)) {
                    //     w[n - t] = w[n - t] + 1
                    //     x = x - ny * 2^((n - t) * wordsize)
                    // }
                    //
                    // Note that due to the normalization, for random inputs the
                    // number of executions of this loop is probably small.
                    while (shiftleft_ge(x, n, ny, t)) {
                        i = 0;
                        j = n - t;
                        c = 0;
                        while (i < t + 1) {
                            tmp = x[j] - ny[i] + c;
                            x[j] = tmp & 0xfffffff;
                            c = tmp >> 28;
                            i++;
                            j++;
                        }
                        w[n - t]++;
                    }
                    for (i = n; i >= t + 1; i--) {
                        // This remains constant within each execution of the loop
                        // and only used for notational convenience.
                        k = i - t - 1;
                        // Estimate w[k] using reciprocal for top two words of ny.
                        u[2] = x[i];
                        u[1] = i > 0 ? x[i - 1] : 0;
                        u[0] = i > 1 ? x[i - 2] : 0;
                        if (u[2] === d[1] && u[1] >= d[0]) {
                            w[k] = 0xfffffff;
                        } else {
                            w[k] = uli.div3by2(r, u, d, neg_d, v);
                        }
                        // Subtract scaled and shifted ny from x.
                        muladd_loop(x, neg_ny, 0, t + 2, w[k], k, 0);
                        // We now expect x[i] to be zero, i.e., that we have
                        // canceled one word of x. In the unlikely event that the
                        // estimate of w[k] is too big, we need to correct the
                        // result by adding a scaled ny once to x.
                        //
                        // By construction 0 <= w[k] < 2^28. Thus, if w[k]
                        // is too big, then x[i] is -1 in two's complement, i.e.,
                        // equal to 0xfffffff.
                        if (x[k + t + 1] === 0xfffffff) {
                            l = 0;
                            j = k;
                            c = 0;
                            while (l < t + 1) {
                                tmp = x[j] + ny[l] + c;
                                x[j] = tmp & 0xfffffff;
                                c = tmp >> 28;
                                l++;
                                j++;
                            }
                            tmp = x[j] + c;
                            x[j] = tmp & 0xfffffff;
                            j++;
                            if (j < x.length) {
                                x[j] = 0;
                            }
                            w[k]--;
                        }
                    }
                    // Denormalize x.
                    shiftright(x, normdist);
                };
            })();
            /* eslint-enable sonarjs/cognitive-complexity */
            /**
             * Sets w = b^e mod m.
             *
             * <p>
             *
             * ASSUMES: b >= 0, e >= 0, and m > 1, and w, b and m have L limbs.
             *
             * <p>
             *
             * References: HAC 14.82.
             *
             * @param w - Array holding the result.
             * @param b - Basis integer.
             * @param e - Exponent.
             * @param m - Modulus.
             */
            uli.modpow_naive = (function() {
                // We use p to store squares, products, and their remainders, q to
                // store quotients during modular reduction, and A to store
                // intermediate results.
                const p = [];
                const q = [];
                const A = [];
                return function(w, b, e, m) {
                    // Initialize or resize temporary space as needed.
                    if (A.length !== m.length) {
                        resize(p, 2 * m.length + 2);
                        resize(q, m.length);
                        resize(A, m.length);
                    }
                    // Index of most significant bit.
                    const n = msbit(e);
                    // We avoid one squaring.
                    if (getbit(e, n) === 1) {
                        set(p, b);
                        uli.div_qr(q, p, m);
                        set(A, p);
                    }
                    // Iterate through the remaining bits of e starting from the
                    // most significant bit.
                    for (let i = n - 1; i >= 0; i--) {
                        // A = A^2 mod m.
                        square(p, A);
                        uli.div_qr(q, p, m);
                        set(A, p);
                        if (getbit(e, i) === 1) {
                            // A = A * b mod m.
                            mul(p, A, b);
                            uli.div_qr(q, p, m);
                            set(A, p);
                        }
                    }
                    set(w, A);
                };
            })();
            /**
             * Extracts the ith block of wordsize bits w from x
             * (padding with zeros from the left) and sets uh such that:
             * w = uh[0] * 2^uh[1], with uh[0] odd and with uh[0] = uh[1] = 0
             * when w = 0.
             *
             * @param uh - Holds the representation of word.
             * @param x - Contains bits.
             * @param i - Index of block of bits.
             * @param wordsize - Number of bits in each block.
             */
            function getuh(uh, x, i, wordsize) {
                let bitIndex = i * wordsize;
                // Get the ith block of wordsize bits.
                uh[0] = 0;
                for (let j = 0; j < wordsize; j++) {
                    uh[0] = uh[0] | getbit(x, bitIndex) << j;
                    bitIndex++;
                }
                // Extract all factors of two.
                uh[1] = 0;
                if (uh[0] !== 0) {
                    while ((uh[0] & 0x1) === 0) {
                        uh[0] = uh[0] >>> 1;
                        uh[1]++;
                    }
                }
            }
            /**
             * Sets w = b^e mod m.
             *
             * <p>
             *
             * ASSUMES: 0 < b < m, e >= 0, and m > 1, and w, b and m have L limbs
             * and e may have an arbirary number of limbs.
             *
             * <p>
             *
             * References: HAC 14.83.
             *
             * @param w - Array holding the result.
             * @param b - Basis integer.
             * @param e - Exponent.
             * @param m - Modulus.
             */
            /* eslint-disable sonarjs/cognitive-complexity */
            uli.modpow = (function() {
                // We use p to store squares, products, and their remainders, q to
                // store quotients during modular reduction, and A to store
                // intermediate results.
                const q = [];
                const A = [
                    [],
                    []
                ];
                const B = [];
                // Alias for cleaner notation.
                const p = A[0];
                return function(w, b, e, m) {
                    const msb = msbit(e) + 1;
                    // Thresholds for pre-computation. These are somewhat
                    // arbitrary, since the optimal thresholds are likely to
                    // differ with the wordsize and JavaScript engine.
                    let k = 2;
                    if (msb > 512) {
                        k++;
                    }
                    if (msb > 640) {
                        k++;
                    }
                    if (msb > 768) {
                        k++;
                    }
                    if (msb > 896) {
                        k++;
                    }
                    if (msb > 1280) {
                        k++;
                    }
                    if (msb > 2688) {
                        k++;
                    }
                    if (msb > 3840) {
                        k++;
                    }
                    // Initialize or resize temporary space as needed.
                    if (q.length !== m.length) {
                        resize(q, m.length);
                        resize(A[0], 2 * m.length + 2);
                        resize(A[1], 2 * m.length + 2);
                        for (let i = 0; i < B.length; i++) {
                            resize(B[i], m.length);
                        }
                    }
                    // Expand the table if needed.
                    if (B.length < (1 << k)) {
                        const len = B.length;
                        B.length = 1 << k;
                        for (let i = len; i < B.length; i++) {
                            B[i] = newarray(m.length);
                        }
                    }
                    // Precompute table
                    // B[0] = 1.
                    B[0][0] = 1;
                    // B[1] = b
                    set(B[1], b);
                    // B[2] = b^2 mod m
                    square(p, b, m.length);
                    uli.div_qr(q, p, m);
                    set(B[2], p);
                    // B[i] = B[i - 1] * b^2 mod m for odd i
                    for (let i = 1; i < 1 << (k - 1); i++) {
                        mul(p, B[2 * i - 1], B[2], m.length);
                        uli.div_qr(q, p, m);
                        set(B[2 * i + 1], p);
                    }
                    // Set A = 1.
                    let s = 0;
                    setzero(A[s]);
                    A[s][0] = 1;
                    // Iterate through the bits of e starting from the most
                    // significant block of bits.
                    const n = Math.floor((msb + k - 1) / k);
                    const uh = [0, 0];
                    for (let i = n; i >= 0; i--) {
                        // Extract the ith block of bits w and represent it as w =
                        // 2^uh[1] * uh[0], with uh[0] odd and with uh[0] = uh[1]
                        // = 0 when w = 0.
                        getuh(uh, e, i, k);
                        // A = A^E mod m, where E = 2^(k - uh[1]).
                        for (let j = 0; j < k - uh[1]; j++) {
                            square(A[s ^ 1], A[s], m.length);
                            s ^= 1;
                            uli.div_qr(q, A[s], m);
                        }
                        // A = A * B[uh[0]] mod m.
                        if (uh[0] !== 0) {
                            mul(A[s ^ 1], A[s], B[uh[0]], m.length);
                            s ^= 1;
                            uli.div_qr(q, A[s], m);
                        }
                        // A = A^E mod m, where E = 2^uh[1].
                        for (let j = 0; j < uh[1]; j++) {
                            square(A[s ^ 1], A[s], m.length);
                            s ^= 1;
                            uli.div_qr(q, A[s], m);
                        }
                    }
                    set(w, A[s]);
                };
            })();
            /* eslint-enable sonarjs/cognitive-complexity */
            /**
             * Returns a table of all possible modular products of a
             * list of bases. More precisely, given a list b of k bases and a
             * modulus m, it returns t, where t is the table computed as t[x]
             * = b[0]^x[0] * ... * b[k-1]^x[k-1] mod m, where x[i] is the ith bit
             * of the integer x.
             *
             * <p>
             *
             * We allow this method to allocate memory, since it is expected to be
             * used rarely relative the amount of computation performed and since
             * more than one table may be used simultaneously.
             *
             * <p>
             *
             * ASSUMES: m has L limbs and b[i] has L limbs and all inputs are
             * positive.
             *
             * @param b - List of bases.
             * @param m - Modulus.
             * @returns t Table for products.
             */
            uli.modpowprodtab_inner = (function() {
                // We use p to store products and q to store quotients during
                // modular reduction.
                const p = [];
                const q = [];
                return function(b, m) {
                    // Initialize or resize temporary space as needed.
                    if (q.length !== m.length) {
                        resize(p, 2 * m.length + 2);
                        resize(q, m.length);
                    }
                    // Make room for table and initialize all elements to one.
                    const t = [];
                    for (let i = 0; i < 1 << b.length; i++) {
                        t[i] = newarray(m.length);
                        t[i][0] = 1;
                    }
                    // Initialize parts of the table with the bases provided.
                    for (let i = 1, j = 0; i < t.length; i = i * 2, j++) {
                        set(t[i], b[j]);
                    }
                    // Perform precalculation using masking for efficiency.
                    for (let mask = 1; mask < t.length; mask++) {
                        const onemask = mask & -mask;
                        mul(p, t[mask ^ onemask], t[onemask]);
                        uli.div_qr(q, p, m);
                        set(t[mask], p);
                    }
                    return t;
                };
            })();
            /**
             * Applies {@link modpowprodtab} to subsequences of a given width of
             * the input and returns the resulting tables as an array.
             *
             * <p>
             *
             * We allow this method to allocate memory, since it is expected to be
             * used rarely relative the amount of computation performed and since
             * more than one table may be used simultaneously.
             *
             * <p>
             *
             * ASSUMES: m has L limbs and b[i] has L limbs and all inputs are
             * positive, and width <= 28.
             *
             * @param b - List of bases.
             * @param m - Modulus.
             * @param width - Maximal number of bases used for each table.
             * @returns t Array of tables for products.
             */
            function modpowprodtab(b, m, width) {
                const t = [];
                for (let i = 0, j = 0; j < b.length; i++, j += width) {
                    t[i] = uli.modpowprodtab_inner(b.slice(j, j + width), m);
                }
                return t;
            }
            uli.modpowprodtab = modpowprodtab;
            /**
             * Sets x to the bit-wise concatenation of the inputs, i.e., the jth
             * least significant bit of the ith word of the output is the ith bit
             * of e[j].
             *
             * <p>
             *
             * ASSUMES: e.length <= 28 and x.length >= bitsize, where
             * is the maximum bitsize of any of the inputs.
             *
             * @param x - Stores bit-wise concatenation of the inputs.
             * @param e - List of integers.
             * @param bitsize - Maximum bitsize of any of the inputs.
             */
            function concbits_inner(x, e, bitsize) {
                setzero(x);
                const w = newarray(e.length);
                // Bit position in each e[j], and word position in x.
                let k = 0;
                // Word position in each e[j].
                for (let i = 0; k < bitsize; i++) {
                    // Simulate leading zero of e[j] if needed.
                    for (let j = 0; j < w.length; j++) {
                        w[j] = i < e[j].length ? e[j][i] : 0;
                    }
                    // Bit position within e[j][i] for each j.
                    for (let b = 0; b < 28 && k < bitsize; b++, k++) {
                        // Bits at position i * 28 + b from all e[j].
                        x[k] = 0;
                        for (let j = w.length - 1; j >= 0; j--) {
                            x[k] <<= 1;
                            x[k] |= (w[j] >> b) & 1;
                        }
                    }
                }
            }
            /**
             * Applies {@link concbits} to subsequences of a given width of the
             * input and returns the resulting large integers as an array.
             *
             * <p>
             *
             * ASSUMES: width <= 28, x[i].length >= msbit(e[i]) + 1 for
             * all i, and x.length = (e.length + width-1) / width.
             *
             * @param x - Stores bit-wise concatenations of the inputs.
             * @param e - List of exponents.
             * @param bitsize - Maximum bitsize of any of the inputs.
             * @param width - Width of each block that is concatenated separately.
             */
            function concbits(x, e, bitsize, width) {
                for (let i = 0, j = 0; j < e.length; i++, j += width) {
                    concbits_inner(x[i], e.slice(j, j + width), bitsize);
                }
            }
            /**
             * Returns maximal index of a most significant bit.
             *
             * @param e - Input non-negative integers.
             * @returns Maximal index of a most significant bit.
             */
            function max_msbit(e) {
                let m = 0;
                for (let i = 0; i < e.length; i++) {
                    m = Math.max(m, msbit(e[i]));
                }
                return m;
            }
            /**
             * Computes a simultaneous exponentiation using tables of pre-computed
             * tables t for at most width bases each, but based on exactly k
             * bases, and modulus m, i.e., it sets w = b[0]^e[0] * ... *
             * b[k-1]^e[k-1], where e has length k.
             *
             * <p>
             *
             * ASSUMES: m > 1 has L limbs and each e[i] has L limbs and all inputs
             * are positive, and that the table was computed with the same number
             * of bases and the same modulus m.
             *
             * @param w - Holds the result.
             * @param t - Tables of products.
             * @param e - List of exponents.
             * @param m - Modulus
             * @param width - Width of each block that is precomputed separately.
             */
            uli.modpowprod = (function() {
                // We use x to store concatenated exponents, q to store quotients
                // during modular reduction, and a dual representation of A to
                // store intermediate results.
                const x = [];
                const q = [];
                const A = [
                    [],
                    []
                ];
                return function(w, t, e, m, width) {
                    // Maximal bitsize of any e[j].
                    const bitsize = max_msbit(e) + 1;
                    // Initialize or resize temporary space as needed.
                    if (q.length !== m.length) {
                        resize(q, m.length);
                        resize(A[0], 2 * m.length + 2);
                        resize(A[1], 2 * m.length + 2);
                    }
                    // Ensure that x has the right number of elements.
                    while (x.length < t.length) {
                        x.push([]);
                    }
                    // Ensure that each x[j] has the right length.
                    if (x[0].length < bitsize) {
                        for (let j = 0; j < t.length; j++) {
                            x[j].length = bitsize;
                        }
                    }
                    // Concatenate exponent bits within each block.
                    concbits(x, e, bitsize, width);
                    // Set A = 1.
                    let s = 0;
                    setone(A[s]);
                    for (let i = bitsize - 1; i >= 0; i--) {
                        // A = A^2 mod m.
                        square(A[s ^ 1], A[s]);
                        s ^= 1;
                        uli.div_qr(q, A[s], m);
                        for (let j = 0; j < t.length; j++) {
                            if (x[j][i] !== 0) {
                                // A = A * t[ j ][ x[j][i] ] mod m.
                                mul(A[s ^ 1], A[s], t[j][x[j][i]]);
                                s ^= 1;
                                uli.div_qr(q, A[s], m);
                            }
                        }
                    }
                    set(w, A[s]);
                };
            })();
            // /**
            //  * Computes a simultaneous exponentiation using a table
            //  * of pre-computed values t for k bases b[0],...,b[k-1] and modulus m,
            //  * i.e., it sets w = b[0]^e[0] * ... * b[k-1]^e[k-1].
            //  *
            //  * <p>
            //  *
            //  * ASSUMES: m > 1 has L limbs and e[i] has L limbs for i = 0,...,k - 1
            //  * and all inputs are positive, and that the table was computed with
            //  * the same number k of bases and the same modulusm.
            //  *
            //  * @param w - Holds the result.
            //  * @param t - Table of products.
            //  * @param e - List of k exponents.
            //  * @param m - Modulus
            //  */
            // export const modpowprod =
            //     (function(): (w: uli_t, t: uli_t[], e: uli_t[], m: uli_t) => void {
            //     // We use p to store squares, products, and their remainders, q to
            //     // store quotients during modular reduction, and A to store
            //     // intermediate results.
            //     const p: uli_t = [];
            //     const q: uli_t = [];
            //     const A: uli_t = [];
            //     return function(w: uli_t, t: uli_t[], e: uli_t[], m: uli_t): void {
            //         // Initialize or resize temporary space as needed.
            //         if (A.length !== m.length) {
            //             resize(p, 2 * m.length + 2);
            //             resize(q, m.length);
            //             resize(A, m.length);
            //         }
            //         // Determine maximal most significant bit position.
            //         let l: size_t = msbit(e[0]);
            //         for (let i: size_t = 1; i < e.length; i++) {
            //             l = Math.max(msbit(e[i]), l);
            //         }
            //         // Set A = 1.
            //         setone(A);
            //         for (let i: size_t = l; i >= 0; i--) {
            //             let x: word_t = 0;
            //             // A = A^2 mod m.
            //             square(p, A);
            //             div_qr(q, p, m);
            //             set(A, p);
            //             // Loop over exponents to form a word x from all the bits
            //             // at a given position.
            //             for (let j: size_t = 0; j < e.length; j++) {
            //                 if (getbit(e[j], i) === 1) {
            //                     x |= 1 << j;
            //                 }
            //             }
            //             // Look up product in pre-computed table if needed.
            //             if (x !== 0) {
            //                 // A = A * t[x] mod m.
            //                 mul(p, A, t[x]);
            //                 div_qr(q, p, m);
            //                 set(A, p);
            //             }
            //         }
            //         set(w, A);
            //     };
            // })();
            /**
             * Returns the bits between the start index and end index
             * as an integer.
             *
             * <p>
             *
             * ASSUMES: s <= most significant bit of x and s < e
             *
             * @param x - Integer to slice.
             * @param s - Inclusive start index.
             * @param e - Exclusive end index.
             * @returns Bits between the start index and end index as an integer.
             */
            function slice(x, s, e) {
                const m = msbit(x);
                // Avoid indexing out of bounds.
                e = Math.min(e, m + 1);
                // Copy and get rid of the lower bits.
                const w = copyarray(x);
                shiftright(w, s);
                // Get rid of higher words.
                const bitlen = e - s;
                w.length = Math.floor((bitlen + 28 - 1) / 28);
                // Get rid of top-most bits.
                const topbits = bitlen % 28;
                if (topbits > 0) {
                    w[w.length - 1] &= 0xfffffff >>> 28 - topbits;
                }
                return w;
            }
            uli.slice = slice;
            /**
             * Returns a hexadecimal representation of this input
             * array by content, i.e., unused bits of each limb are dropped before
             * conversion.
             *
             * @param x - Array of words.
             * @returns Hexadecimal string representation of the array.
             */
            function hex(x) {
                /* eslint-disable @typescript-eslint/no-explicit-any */
                const dense = change_wordsize(x, 28, 8);
                /* eslint-enable @typescript-eslint/no-explicit-any */
                normalize(dense);
                return byteArrayToHex(dense.reverse());
            }
            uli.hex = hex;
            /**
             * Returns the integer represented by the input.
             *
             * @param s - Hexadecimal representation of an integer.
             * @returns Represented integer.
             */
            function hex_to_li(s) {
                const b = hexToByteArray(s);
                const r = b.reverse();
                return change_wordsize(r, 8, 28);
            }
            uli.hex_to_li = hex_to_li;
        })(uli = arithm.uli || (arithm.uli = {}));
        let li;
        (function(li) {
            var VerificatumObject = verificatum.base.VerificatumObject;
            var newarray = verificatum.arithm.uli.newarray;
            var uli_add = verificatum.arithm.uli.add;
            var uli_cmp = verificatum.arithm.uli.cmp;
            var uli_copyarray = verificatum.arithm.uli.copyarray;
            var uli_div_qr = verificatum.arithm.uli.div_qr;
            var uli_getbit = verificatum.arithm.uli.getbit;
            var uli_hex = verificatum.arithm.uli.hex;
            var uli_iszero = verificatum.arithm.uli.iszero;
            var uli_lsbit = verificatum.arithm.uli.lsbit;
            var uli_modpow = verificatum.arithm.uli.modpow;
            var uli_msbit = verificatum.arithm.uli.msbit;
            var uli_msword = verificatum.arithm.uli.msword;
            var uli_mul = verificatum.arithm.uli.mul;
            var uli_muladd_loop = verificatum.arithm.uli.muladd_loop;
            var uli_normalize = verificatum.arithm.uli.normalize;
            var uli_resize = verificatum.arithm.uli.resize;
            var uli_set = verificatum.arithm.uli.set;
            var uli_setzero = verificatum.arithm.uli.setzero;
            var uli_shiftleft = verificatum.arithm.uli.shiftleft;
            var uli_shiftright = verificatum.arithm.uli.shiftright;
            var uli_square = verificatum.arithm.uli.square;
            var uli_sub = verificatum.arithm.uli.sub;
            /**
             * Simple container class for signed mutable integers with manual
             * memory management as for uli_t. Instantiated with sign and value,
             * with a length of the underlying array for an uninitialized
             * instance, or with no parameters.
             *
             * @param first - Empty, sign, or number of words in empty instance.
             * @param second - Empty or array containing value.
             * @returns Instance of a container for signed integers.
             */
            class SLI extends VerificatumObject {
                /**
                 * Constructs an SLI.
                 *
                 * @param first
                 *
                 * @throws Error if an input is incorrectly formatted, but does
                 * not perform a full dynamic type check of the input.
                 */
                constructor(first, second) {
                    super();
                    if (typeof first === "undefined") {
                        this.sign = 1;
                        this.value = [];
                        this.length = this.value.length;
                    } else if (typeof second === "undefined") {
                        if (first < 0) {
                            throw Error("First parameter is negative! (${first})");
                        }
                        this.sign = 1;
                        this.value = newarray(first);
                        this.length = this.value.length;
                    } else {
                        if (!(first == -1 || first == 0 || first == 1)) {
                            throw Error("First parameter is not a sign! (${first})");
                        }
                        this.sign = first;
                        this.value = second;
                        this.length = this.value.length;
                    }
                }
            }
            li.SLI = SLI;
            /**
             * Thin layer on top of the uli module that provides mutable signed
             * integers with basic modular arithmetic along with a few low level
             * routines that requires signed integers to implement.
             *
             * <p>
             *
             * It also uses a minimal container class SLI that represents a
             * signed integer. All operations on are executed on pre-existing SLI
             * instances, so it is the responsibility of the programmer to ensure
             * that data fits inside the allocated space.
             *
             * <p>
             *
             * This approach is motivated by the need to preserve efficiency and
             * still encapsulate as much implementation details as possible.
             *
             * <p>
             *
             * <a href="http://cacr.uwaterloo.ca/hac">Handbook of Cryptography
             * (HAC), Alfred J. Menezes, Paul C. van Oorschot and Scott
             * A. Vanstone</a> gives a straightforward introduction to the basic
             * algorithms used and we try to follow their notation for easy
             * reference.
             *
             * <p>
             *
             * <table style="text-align: left;">
             * <tr><th>Reference        </th><th> Operation</th><th> Comment</th></tr>
             * <tr><td>HAC 2.149</td><td> Legendre symbol</td><td></td></tr>
             * <tr><td>HAC 14.36</td><td> Montgomery modular multiplication</td><td></td></tr>
             * <tr><td>HAC 14.61</td><td> Extended Euclidian algorithm (variation)</td><td></td></tr>
             * <tr><td>HAC 14.94</td><td> Montgomery modular exponentiation</td><td></td></tr>
             * </table>
             * TSDOC_MODULE
             */
            // Removed WASM code here.
            /**
             * Truncates the input to the shortest possible array
             * that represents the same absolute value in two's complement, i.e.,
             * there is always a leading zero bit.
             *
             * @param x - Array to be truncated.
             * @param mask_top - Word used to normalize.
             */
            function normalize(x, mask_top) {
                uli_normalize(x.value, mask_top);
                x.length = x.value.length;
            }
            li.normalize = normalize;
            /**
             * Resizes the underlying array to the given length.
             *
             * @param a - SLI to be resized.
             * @param len - New length of SLI.
             */
            function resize(a, len) {
                uli_resize(a.value, len);
                a.length = a.value.length;
            }
            li.resize = resize;
            /**
             * Returns the sign of a number.
             *
             * @param n - A Javascript "number".
             * @returns Sign of number as -1, 0, or 1.
             */
            function sign(n) {
                if (n > 0) {
                    return 1;
                } else if (n === 0) {
                    return 0;
                } else {
                    return -1;
                }
            }
            li.sign = sign;

            function set(a, b) {
                if (typeof b === "number") {
                    a.sign = sign(b);
                    uli_set(a.value, Math.abs(b));
                } else {
                    a.sign = b.sign;
                    uli_set(a.value, b.value);
                }
            }
            li.set = set;

            function copy(a, len) {
                if (typeof len === "undefined") {
                    len = a.length;
                }
                return new SLI(a.sign, uli_copyarray(a.value, len));
            }
            li.copy = copy;
            /**
             * Returns -1, 0, or 1 depending on if a < b, a == b, or
             * a > b.
             *
             * @param a - Left SLI.
             * @param b - Right SLI.
             * @returns Value of comparison predicate on a and b.
             */
            function cmp(a, b) {
                if (a.sign < b.sign) {
                    return -1;
                } else if (a.sign > b.sign) {
                    return 1;
                } else if (a.sign === 0) {
                    return 0;
                }
                return (uli_cmp(a.value, b.value) * a.sign);
            }
            li.cmp = cmp;
            /**
             * Returns true or false depending on if a = b or not.
             *
             * @param a - Left SLI.
             * @param b - Right SLI.
             * @returns True or false depending on if the SLIs represent the same
             * integer or not.
             */
            function equals(a, b) {
                return a.sign === b.sign && uli_cmp(a.value, b.value) === 0;
            }
            li.equals = equals;
            /**
             * Returns true or false depending on a = 0 or not.
             *
             * @param a - Integer represented as a SLI.
             * @returns True or false depending on if a is zero or not.
             */
            function iszero(a) {
                return a.sign === 0;
            }
            li.iszero = iszero;
            /**
             * Returns true or false depending on a = 1 or not.
             *
             * @param a - Integer represented as a SLI.
             * @returns True or false depending on if a is zero or not.
             */
            function isone(a) {
                return a.sign === 1 && a.value[0] === 1 && uli_msword(a.value) === 0;
            }
            li.isone = isone;
            /**
             * Shifts the given number of bits within the SLI,
             * i.e., the allocated space is not expanded.
             *
             * <p>
             *
             * ASSUMES: offset >= 0.
             *
             * @param x - SLI to be shifted.
             * @param offset - Number of bit positions to shift.
             */
            function shiftleft(a, offset) {
                uli_shiftleft(a.value, offset);
            }
            li.shiftleft = shiftleft;
            /**
             * Shifts the given number of bits to the right within
             * the allocated space, i.e., the space is not reduced.
             *
             * <p>
             *
             * ASSUMES: offset >= 0.
             *
             * @param x - SLI to be shifted.
             * @param offset - Number of bit positions to shift.
             */
            function shiftright(a, offset) {
                uli_shiftright(a.value, offset);
                if (uli_iszero(a.value)) {
                    a.sign = 0;
                }
            }
            li.shiftright = shiftright;
            /**
             * Sets a = b + c.
             *
             * <p>
             *
             * ASSUMES: b and c have B and B' bits and a can store B + B' + 1
             * bits, or B + B' bits depending on if the signs of b and c are equal
             * or not.
             *
             * @param a - SLI holding the result.
             * @param b - Left term.
             * @param c - Right term.
             */
            function add(a, b, c) {
                const w = a.value;
                const x = b.value;
                const y = c.value;
                // 0 + 0  or  x + y  or  -x + -y.
                if (b.sign === c.sign) {
                    if (b.sign === 0) {
                        a.sign = 0;
                        uli_setzero(w);
                    } else {
                        a.sign = b.sign;
                        uli_add(w, x, y);
                    }
                    // x + -y  or  -x + y
                } else {
                    const s = uli_cmp(x, y);
                    if (s > 0) {
                        a.sign = b.sign;
                        uli_sub(w, x, y);
                    } else if (s < 0) {
                        a.sign = c.sign;
                        uli_sub(w, y, x);
                    } else {
                        a.sign = 0;
                        uli_setzero(w);
                    }
                }
            }
            li.add = add;
            /**
             * Sets a = b - c.
             *
             * <p>
             *
             * ASSUMES: b and c have B and B' bits and a can store B + B' + 1
             * bits, or B + B' bits depending on if the signs of b and c are
             * distinct or not.
             *
             * @param a - SLI holding the result.
             * @param b - Left term.
             * @param c - Right term.
             */
            function sub(a, b, c) {
                const w = a.value;
                const x = b.value;
                const y = c.value;
                // x - y  or  -x - -y.
                if (b.sign === c.sign) {
                    // x >= y.
                    if (uli_cmp(x, y) >= 0) {
                        uli_sub(w, x, y);
                        a.sign = b.sign;
                        // x < y.
                    } else {
                        uli_sub(w, y, x);
                        a.sign = (-b.sign);
                    }
                    // -x - y  or  x - -y.
                } else {
                    uli_add(w, x, y);
                    if (b.sign === 0) {
                        a.sign = (-c.sign);
                    } else {
                        a.sign = b.sign;
                    }
                }
                if (uli_iszero(w)) {
                    a.sign = 0;
                }
            }
            li.sub = sub;
            /**
             * Sets a = b * c.
             *
             * <p>
             *
             * ASSUMES: b and c have L and L' limbs and a has at least L + L' limbs.
             *
             * @param a - SLI holding the result.
             * @param b - Left factor.
             * @param c - Right factor.
             */
            li.mul = (function() {
                const t = [];
                return function(a, b, c, len) {
                    if (a === b || a === c) {
                        if (t.length !== a.length) {
                            uli_resize(t, a.length);
                        }
                        uli_mul(t, b.value, c.value, len);
                        uli_set(a.value, t);
                    } else {
                        uli_mul(a.value, b.value, c.value, len);
                        a.length = a.value.length;
                    }
                    a.sign = (b.sign * c.sign);
                };
            })();
            /**
             * Sets a = b * c, where c is a word.
             *
             * <p>
             *
             * ASSUMES: b has L limbs, c is a word such that 0 <=
             * c < 2^28, and a has at least L + 1 limbs.
             *
             * @param a - SLI holding the result.
             * @param b - Left factor.
             * @param c - Right factor.
             */
            li.mul_word = (function() {
                const C = new SLI(1);
                return function(a, b, c) {
                    set(C, c);
                    li.mul(a, b, C);
                };
            })();
            /**
             * Sets a = b^2.
             *
             * <p>
             *
             * ASSUMES: b has L words and a has at least 2 * L limbs.
             *
             * @param a - SLI holding the result.
             * @param b - Factor.
             */
            function square(a, b) {
                uli_square(a.value, b.value);
                a.sign = (b.sign * b.sign);
            }
            li.square = square;
            /**
             * Computes q, r such that q = a / b + r with a / b and r rounded with
             * sign, in particular, if b is positive, then 0 <= r < b. Then it
             * sets a = r. We are faithful to the mathematical definition for
             * signs.
             *
             * <p>
             *
             * ASSUMES: a and b are positive, a has L words and at least L + 2
             * limbs (i.e., two leading unused zero words), b has L' limbs, and q
             * has at least L'' = max{L - L', L', 0} + 1 limbs and will finally
             * hold a result with at most L'' words and a leading zero limb.
             *
             * @param q - SLI holding the quotient.
             * @param a - Dividend.
             * @param b - Divisor.
             */
            function div_qr(q, a, b) {
                let qsign;
                let asign;
                uli_div_qr(q.value, a.value, b.value);
                // Division without remainder.
                if (uli_iszero(a.value)) {
                    qsign = (a.sign * b.sign);
                    asign = 0;
                    // Division with remainder, so we need to round.
                } else {
                    if (a.sign * b.sign === 1) {
                        asign = a.sign;
                        qsign = a.sign;
                    } else {
                        // This is safe since a.value < b.value and a.value has at
                        // least one more limb than b.value.
                        uli_sub(a.value, b.value, a.value);
                        // This is safe, since q has an additional limb.
                        uli_add(q.value, q.value, [1]);
                        asign = b.sign;
                        qsign = a.sign;
                    }
                }
                q.sign = qsign;
                a.sign = asign;
            }
            li.div_qr = div_qr;
            /**
             * Sets a = b mod c (this is merely syntactic sugar for
             * div_qr).
             *
             * @param a - SLI holding the result.
             * @param b - Dividend.
             * @param c - Modulus.
             */
            li.mod = (function() {
                // Temporary space for quotient and remainder.
                const q = new SLI();
                const r = new SLI();
                return function(a, b, c) {
                    // Resize temporary space if needed. This is conservative.
                    const qlen = b.length + 1;
                    if (q.length < qlen) {
                        resize(q, qlen);
                    }
                    const rlen = b.length + 2;
                    if (r.length < rlen) {
                        resize(r, rlen);
                    }
                    // Copy b to temporary remainder, reduce and set result.
                    set(r, b);
                    div_qr(q, r, c);
                    set(a, r);
                };
            })();
            // Help function for egcd. Consult HAC 14.61 (5th printing + errata)
            // for information.
            function egcd_binary_reduce(u, A, B, x, y) {
                while ((u.value[0] & 0x1) === 0) {
                    // u = u / 2.
                    shiftright(u, 1);
                    // A = 0 mod 2 and B = 0 mod 2.
                    if ((A.value[0] & 0x1) === 0 && (B.value[0] & 0x1) === 0) {
                        // A = A / 2 and B = B / 2.
                        shiftright(A, 1);
                        shiftright(B, 1);
                    } else {
                        // A = (A + y) / 2.
                        add(A, A, y);
                        shiftright(A, 1);
                        // B = (B - x) / 2.
                        sub(B, B, x);
                        shiftright(B, 1);
                    }
                }
            }
            li.egcd_binary_reduce = egcd_binary_reduce;
            /**
             * Sets a, b, and v such that a * x + b * y = v and v is
             * the greatest common divisor of x and y.
             *
             * <p>
             *
             * References: HAC 14.61 (5th printing + errata)
             *
             * @param a - Linear coefficient of Bezout expression.
             * @param b - Linear coefficient of Bezout expression.
             * @param v - Greatest common divisor of x and y.
             * @param x - Left integer.
             * @param y - Right integer.
             */
            li.egcd = (function() {
                // Temporary space.
                const xs = new SLI();
                const ys = new SLI();
                const A = new SLI();
                const B = new SLI();
                const C = new SLI();
                const D = new SLI();
                const u = new SLI();
                return function(a, b, v, x, y) {
                    if (iszero(x) || iszero(y)) {
                        set(a, 0);
                        set(b, 0);
                        set(v, 0);
                        return;
                    }
                    const len = Math.max(x.length, y.length) + 1;
                    if (A.length !== len) {
                        resize(xs, len);
                        resize(ys, len);
                        resize(A, len);
                        resize(B, len);
                        resize(C, len);
                        resize(D, len);
                        resize(u, len);
                    }
                    set(xs, x);
                    set(ys, y);
                    set(A, 1);
                    set(B, 0);
                    set(C, 0);
                    set(D, 1);
                    // Extract all common factors of two.
                    const common_twos = Math.min(uli_lsbit(xs.value), uli_lsbit(ys.value));
                    shiftright(xs, common_twos);
                    shiftright(ys, common_twos);
                    set(u, xs);
                    set(v, ys);
                    // Use binary laws for greatest common divisors.
                    while (!iszero(u)) {
                        egcd_binary_reduce(u, A, B, xs, ys);
                        egcd_binary_reduce(v, C, D, xs, ys);
                        if (cmp(u, v) >= 0) {
                            sub(u, u, v);
                            sub(A, A, C);
                            sub(B, B, D);
                        } else {
                            sub(v, v, u);
                            sub(C, C, A);
                            sub(D, D, B);
                        }
                    }
                    set(a, C);
                    set(b, D);
                    shiftleft(v, common_twos);
                };
            })();
            /**
             * Sets a such that w * x = 1 mod p.
             *
             * <p>
             *
             * ASSUMES: p > 0 is on odd prime.
             *
             * <p>
             *
             * References: HAC 14.61.
             *
             * @param w - SLI holding the result.
             * @param x - Integer to invert.
             * @param p - Positive odd prime modulus.
             */
            li.modinv = (function() {
                // Temporary space.
                const a = new SLI();
                const b = new SLI();
                const v = new SLI();
                return function(w, x, p) {
                    const len = Math.max(p.length, x.length);
                    if (a.length !== len) {
                        resize(a, len);
                        resize(b, len);
                        resize(v, len);
                    }
                    li.egcd(a, b, v, x, p);
                    if (a.sign < 0) {
                        add(w, p, a);
                    } else {
                        set(w, a);
                    }
                };
            })();
            /**
             * Sets w = b^e mod m.
             *
             * <p>
             *
             * ASSUMES: 0 < b < m, e > 0, and m > 1, m has L limbs, w has at least
             * L limbs, and b and e have arbitrary number of limbs.
             *
             * @param w - SLI holding the result.
             * @param b - Basis integer.
             * @param e - Exponent.
             * @param m - Modulus.
             */
            function modpow(w, b, e, m) {
                uli_modpow(w.value, b.value, e.value, m.value);
                w.sign = 1;
            }
            li.modpow = modpow;
            /**
             * Returns (a | b), i.e., the Legendre symbol of a modulo
             * b for an odd prime b. (This is essentially a GCD algorithm that
             * keeps track of the symbol.)
             *
             * <p>
             *
             * References: HAC 2.149.
             *
             * @param a - Integer modulo b.
             * @param b - An odd prime modulus.
             * @returns Legendre symbol of this instance modulo the input.
             */
            /* eslint-disable sonarjs/cognitive-complexity */
            function legendre(a, b) {
                a = copy(a);
                b = copy(b);
                let s = 1;
                for (;;) {
                    if (iszero(a)) {
                        return 0;
                    } else if (isone(a)) {
                        return s;
                    } else {
                        // a = 2^e * a'
                        const e = uli_lsbit(a.value);
                        // a = a'.
                        shiftright(a, e);
                        // Least significant words of a and b.
                        const aw = a.value[0];
                        const bw = b.value[0];
                        // e = 1 mod 2 and b = 3,5 mod 8.
                        if (e % 2 === 1 && (bw % 8 === 3 || bw % 8 === 5)) {
                            s = (-s);
                        }
                        // b = a = 3 mod 4.
                        if (bw % 4 === 3 && aw % 4 === 3) {
                            s = (-s);
                        }
                        // Corresponds to finding the GCD.
                        if (isone(a)) {
                            return s;
                        }
                        // Replacement for recursive call.
                        li.mod(b, b, a);
                        const t = a;
                        a = b;
                        b = t;
                    }
                }
            }
            li.legendre = legendre;
            /* eslint-enable sonarjs/cognitive-complexity */
            /**
             * Sets w to an integer such that w^2 = x mod p, i.e., it
             * computes the square root of an integer modulo a positive odd prime
             * employing the Tonelli-Shanks algorithm.
             *
             * @param w - Holding the result.
             * @param x - Integer of which the square root is computed.
             * @param p - Positive odd prime modulus.
             */
            li.modsqrt = (function() {
                const ONE = new SLI(1);
                set(ONE, 1);
                const TWO = new SLI(1);
                set(TWO, 2);
                const a = new SLI();
                const n = new SLI();
                const v = new SLI();
                const k = new SLI();
                const r = new SLI();
                const z = new SLI();
                const c = new SLI();
                const tmp = new SLI();
                return function(w, x, p) {
                    const plen = uli_msword(p.value) + 1;
                    const len = 2 * plen + 2;
                    if (a.length !== len) {
                        resize(a, len);
                        resize(n, len);
                        resize(v, len);
                        resize(k, len);
                        resize(r, len);
                        resize(z, len);
                        resize(c, len);
                        resize(tmp, len);
                    }
                    li.mod(a, x, p);
                    if (iszero(a)) {
                        set(w, 0);
                        return;
                    }
                    if (equals(p, TWO)) {
                        set(w, a);
                        return;
                    }
                    // p = 3 mod 4
                    if ((p.value[0] & 0x3) === 0x3) {
                        // v = p + 1
                        add(v, p, ONE);
                        // v = v / 4
                        shiftright(v, 2);
                        // w = a^((p + 1) / 4) mod p
                        modpow(w, a, v, p);
                        return;
                    }
                    // Compute k and s, where p = 2^s * (2 * k + 1) + 1
                    // k = p - 1
                    sub(k, p, ONE);
                    // (p - 1) = 2^s * k
                    let s = uli_lsbit(k.value);
                    shiftright(k, s);
                    // k = k - 1
                    sub(k, k, ONE);
                    // k = k / 2
                    shiftright(k, 1);
                    // r = a^k mod p
                    modpow(r, a, k, p);
                    // n = r^2 mod p
                    li.mul(tmp, r, r);
                    li.mod(n, tmp, p);
                    // n = n * a mod p
                    li.mul(tmp, n, a);
                    li.mod(n, tmp, p);
                    // r = r * a mod p
                    li.mul(tmp, r, a);
                    li.mod(r, tmp, p);
                    if (isone(n)) {
                        set(w, r);
                        return;
                    }
                    // Generate a quadratic non-residue
                    set(z, 2);
                    // while z is a quadratic residue
                    while (legendre(z, p) === 1) {
                        // z = z + 1
                        add(z, z, ONE);
                    }
                    set(v, k);
                    // v = 2k
                    shiftleft(v, 1);
                    // v = 2k + 1
                    add(v, v, ONE);
                    // c = z^v mod p
                    modpow(c, z, v, p);
                    let t = 0;
                    while (cmp(n, ONE) > 0) {
                        // k = n
                        set(k, n);
                        // t = s
                        t = s;
                        s = 0;
                        // k != 1
                        while (!isone(k)) {
                            // k = k^2 mod p
                            li.mul(tmp, k, k);
                            li.mod(k, tmp, p);
                            // s = s + 1
                            s++;
                        }
                        // t = t - s
                        t -= s;
                        // v = 2^(t-1)
                        set(v, ONE);
                        shiftleft(v, t - 1);
                        // c = c^v mod p
                        modpow(tmp, c, v, p);
                        set(c, tmp);
                        // r = r * c mod p
                        li.mul(tmp, r, c);
                        li.mod(r, tmp, p);
                        // c = c^2 mod p
                        li.mul(tmp, c, c);
                        li.mod(c, tmp, p);
                        // n = n * c mod p
                        li.mul(tmp, n, c);
                        li.mod(n, tmp, p);
                    }
                    set(w, r);
                };
            })();
            /**
             * Returns a raw (no leading "0x" or similar) hexadecimal
             * representation of the input with sign indicated by a leading "-"
             * character if negative and capital characters.
             *
             * @param a - SLI to represent.
             * @returns Hexadecimal representation of SLI.
             */
            function hex(a) {
                let s = "";
                if (a.sign < 0) {
                    s = "-";
                }
                return s + uli_hex(a.value);
            }
            li.hex = hex;
            /**
             * Returns the Montomery inverse of m modulo 2^28, i.e., the
             * inverse w such that w = -m^(-1) mod 2^28.
             *
             * <p>
             *
             * ASSUMES: m is non-zero and odd.
             *
             * <p>
             *
             * @returns Montgomery inverse of m.
             */
            function neginvm_mont(m) {
                // This is a naive implementation, but we cache the output in
                // calling functions so readability and conciseness takes
                // precendence.
                // Make room for result.
                const len = Math.max(2, m.length) + 1;
                const a = new SLI(len);
                const b = new SLI(len);
                const v = new SLI(len);
                // x = m
                const x = new SLI(1, m);
                // y = 2^28
                const y = new SLI(1, [0x0, 0x1]);
                // am + by = v = 1
                li.egcd(a, b, v, x, y);
                // -m^(-1) mod 2^28
                return (0x10000000 - a.value[0]) & 0xfffffff;
            }
            li.neginvm_mont = neginvm_mont;
            /**
             * Montgomery multiplication, i.e., it sets a = x * y * R^(-1) mod m,
             * where b = 2^28, R = b^n, and n is the number of limbs in
             * m, i.e., m < 2^n.
             *
             * <p>
             *
             * ASSUMES: m > 0 is odd and 0 <= x,y < m, m has L limbs of which at
             * least the top two words equal zero, a is distinct from x, y, and m
             * and have 2 * L limbs, and finally x and y must have at least L
             * limbs.
             *
             * <p>
             *
             * References: HAC 14.36.
             */
            li.mul_mont = (function() {
                // In applications m is typically re-used, so we avoid computing
                // m^(-1) mod
                let w;
                let old_m0;
                return function(a, x, y, m) {
                    const L = m.length;
                    // Cache the Montgomery inverse of m mod b, since it is likely
                    // that we need it again soon.
                    if (old_m0 !== m[0]) {
                        w = neginvm_mont(m) | 0;
                        old_m0 = m[0];
                    }
                    // a = 0
                    uli_setzero(a);
                    // yw = y[0] * w
                    let yw = 0;
                    // M4_WORD_MODMUL
                    yw = ((yw | 0) + (y[0] & 0x3fff) * (w & 0x3fff) + (((y[0] >>> 14) * (w & 0x3fff) + (y[0] & 0x3fff) * (w >>> 14)) << 14)) & 0xfffffff;
                    // Position within a thought of as the location of its least
                    // significant word. We let the representation of a slide
                    // upwards to simulate shifting.
                    let pos = 0;
                    const n = uli_msword(m) + 1;
                    // Loop invariant: a < 4 * m, i.e., we need one additional
                    // word to store a. The loop invariant is satisfied when i =
                    // 0, since a = 0 in this case.
                    for (let i = 0; i < n; i++) {
                        // u = (a[0] + x[i] * y[0]) * w mod b
                        // This implies that we have 0 <= u < b as an integer.
                        let u = 0;
                        // M4_WORD_MODMUL
                        u = ((u | 0) + (a[pos] & 0x3fff) * (w & 0x3fff) + (((a[pos] >>> 14) * (w & 0x3fff) + (a[pos] & 0x3fff) * (w >>> 14)) << 14)) & 0xfffffff;
                        // M4_WORD_MODMUL
                        u = ((u | 0) + (x[i] & 0x3fff) * (yw & 0x3fff) + (((x[i] >>> 14) * (yw & 0x3fff) + (x[i] & 0x3fff) * (yw >>> 14)) << 14)) & 0xfffffff;
                        // a = a + y * x[i]
                        uli_muladd_loop(a, y, 0, L, x[i], pos, 0);
                        // We know that 0 <= x[i] < b. Thus, we now have:
                        // a < 4 * m + m * b
                        // a = a + m * u
                        uli_muladd_loop(a, m, 0, L, u, pos, 0);
                        // We know that 0 <= u < b. Thus, we now have:
                        // a < 4 * m + 2 * m * b
                        // a = a / b
                        // Lazy right shift by 28 bits.
                        pos++;
                        // The loop invariant is now satisfied, since b > 1 implies:
                        // a / b < (2 + 4/b) * m < 4 * m
                    }
                    // Now we do all n right shifts at once.
                    for (let j = n; j < n + L; j++) {
                        a[j + 0 - n] = a[j] | 0;
                    }
                    for (let j = L; j < 2 * L; j++) {
                        a[j] = 0;
                    }
                    // Without right shifts a is bounded by 2 * m * m and we shift
                    // n positions. Thus, a < 2 * m which implies that 0 <= a < m
                    // or 0 <= a - m < m. The loop invariant is simplistic to be
                    // easy to understand.
                    // a = min(a, a - m)
                    if (uli_cmp(a, m) >= 0) {
                        uli_sub(a, a, m);
                    }
                };
            })();
            /**
             * Sets w = x^e mod m using Montgomery exponentiation.
             *
             * <p>
             *
             * ASSUMES: x >= 0, e >= 0, and m > 1 is odd, and w, x and m have L limbs.
             *
             * <p>
             *
             * References: HAC 14.94.
             *
             * @param w - Array holding the result.
             * @param x - Basis integer.
             * @param e - Exponent.
             * @param m - Modulus.
             */
            li.modpow_mont = (function() {
                // Only used as pointers for determining caching
                let old_n = 0;
                let old_x = [];
                let old_m = [];
                // Temporary variables which are reused if possible, and values
                // are cached if possible.
                //
                // We use a twin representation of A in the algorithm to avoid
                // that mont_mul() overwrites its input. We use the pattern
                //
                // mont_mul(A[b ^ 1], A[b], A[b], m);  b ^= 1;
                //
                // consistently to make sure that A[b] always holds the result. In
                // each call mont_mul(w, x, y, m) the inputs satisfy the
                // following:
                //
                // - w has 2 * l limbs and is distinct from x, y, and m
                // - m has l limbs and at most l - 2 words
                // - 0 <= x, y < m
                // - x and y has at least l limbs
                const mt = [];
                // Temporary variable which is ignored.
                const q = [];
                // R mod m
                const Rmodm = [];
                // R^2 mod m
                const R2modm = [];
                const xx = [];
                const xt = [];
                const A = [
                    [],
                    []
                ];
                const one = [];
                return function(w, x, e, m) {
                    // Number of limbs needed to store m.
                    const n = uli_msword(m) + 1;
                    // We want two additional leading zero limbs.
                    const L = n + 2;
                    // Resize temporary space as needed and initialize values that
                    // are static.
                    if (n !== old_n) {
                        // Values in [0, m], but stored with L limbs, i.e., at
                        // least two leading zero words.
                        uli_resize(mt, L);
                        uli_resize(xx, L);
                        uli_resize(one, L);
                        uli_resize(Rmodm, L);
                        // Values in [0, m], but stored with 2 * L limbs.
                        uli_resize(xt, 2 * L);
                        uli_resize(R2modm, 2 * L);
                        uli_resize(A[0], 2 * L);
                        uli_resize(A[1], 2 * L);
                        // one = 1.
                        uli_setzero(one);
                        one[0] = 0x1;
                        // Ignored in further computations.
                        uli_resize(q, L + 2);
                        old_n = n;
                    }
                    // Cache computations that only depend on m.
                    if (m !== old_m) {
                        // mt = m, but with two leading zero limbs.
                        uli_set(mt, m);
                        // Rmodm = R mod m using L limbs.
                        uli_setzero(q);
                        uli_setzero(Rmodm);
                        Rmodm[n] = 1;
                        uli_div_qr(q, Rmodm, m);
                        // R2modm = R^2 mod m using 2 * L limbs.
                        uli_setzero(q);
                        uli_setzero(R2modm);
                        R2modm[2 * n] = 1;
                        uli_div_qr(q, R2modm, m);
                        old_m = m;
                    }
                    // Cache computations that depend on m and x.
                    if (x !== old_x) {
                        // xt = Mont(x, R^2 mod m, m)
                        uli_set(xx, x);
                        li.mul_mont(xt, xx, R2modm, mt);
                        old_x = x;
                    }
                    // Alternating bit for twin view of A
                    let b = 0;
                    // A = R mod m
                    uli_set(A[b], Rmodm);
                    for (let i = uli_msbit(e); i >= 0; i--) {
                        // A = Mont(A, A, m)
                        li.mul_mont(A[b ^ 1], A[b], A[b], mt);
                        b ^= 1;
                        // ith bit of e is 1
                        if (uli_getbit(e, i) === 1) {
                            // A = Mont(A, xt, m)
                            li.mul_mont(A[b ^ 1], A[b], xt, mt);
                            b ^= 1;
                        }
                    }
                    // A = Mont(A, 1, m)
                    li.mul_mont(A[b ^ 1], A[b], one, mt);
                    b ^= 1;
                    // Make sure that the output holds the result. We are
                    // guaranteed that A[b] < m, so this is safe.
                    uli_set(w, A[b]);
                };
            })();
        })(li = arithm.li || (arithm.li = {}));
        var SLI = verificatum.arithm.li.SLI;
        var change_wordsize = verificatum.base.change_wordsize;
        var hexToByteArray = verificatum.base.hexToByteArray;
        var iszero = verificatum.arithm.uli.iszero;
        var li_add = verificatum.arithm.li.add;
        var li_cmp = verificatum.arithm.li.cmp;
        var li_div_qr = verificatum.arithm.li.div_qr;
        var li_egcd = verificatum.arithm.li.egcd;
        var li_equals = verificatum.arithm.li.equals;
        var li_hex = verificatum.arithm.li.hex;
        var li_iszero = verificatum.arithm.li.iszero;
        var li_legendre = verificatum.arithm.li.legendre;
        var li_modpow_mont = verificatum.arithm.li.modpow_mont;
        var li_modsqrt = verificatum.arithm.li.modsqrt;
        var li_mul = verificatum.arithm.li.mul;
        var li_normalize = verificatum.arithm.li.normalize;
        var li_set = verificatum.arithm.li.set;
        var li_square = verificatum.arithm.li.square;
        var li_sub = verificatum.arithm.li.sub;
        var modpowprod = verificatum.arithm.uli.modpowprod;
        var modpowprodtab = verificatum.arithm.uli.modpowprodtab;
        var normalize = verificatum.arithm.uli.normalize;
        var ofType = verificatum.base.ofType;
        var uli_WORDSIZE = verificatum.arithm.uli.WORDSIZE;
        var uli_cmp = verificatum.arithm.uli.cmp;
        var uli_copyarray = verificatum.arithm.uli.copyarray;
        var uli_getbit = verificatum.arithm.uli.getbit;
        var uli_hex = verificatum.arithm.uli.hex;
        var uli_iszero = verificatum.arithm.uli.iszero;
        var uli_modpow = verificatum.arithm.uli.modpow;
        var uli_modpow_naive = verificatum.arithm.uli.modpow_naive;
        var uli_msbit = verificatum.arithm.uli.msbit;
        var uli_newarray = verificatum.arithm.uli.newarray;
        var uli_normalize = verificatum.arithm.uli.normalize;
        var uli_resize = verificatum.arithm.uli.resize;
        var uli_set = verificatum.arithm.uli.set;
        var uli_shiftleft = verificatum.arithm.uli.shiftleft;
        var uli_shiftright = verificatum.arithm.uli.shiftright;
        var uli_slice = verificatum.arithm.uli.slice;
        let ModPowAlg;
        (function(ModPowAlg) {
            ModPowAlg[ModPowAlg["naive"] = 0] = "naive";
            ModPowAlg[ModPowAlg["window"] = 1] = "window";
            ModPowAlg[ModPowAlg["montgomery"] = 2] = "montgomery";
        })(ModPowAlg = arithm.ModPowAlg || (arithm.ModPowAlg = {}));
        /**
         * Class for large immutable integers that handles memory
         * allocation and provided utility functions.
         */
        class LI extends SLI {
            /* eslint-disable @typescript-eslint/no-explicit-any */
            /* eslint-disable sonarjs/cognitive-complexity */
            constructor(...args) {
                super();
                let sign;
                let value;
                if (args.length == 1) {
                    // Array of words.
                    if (ofType(args[0], "array") &&
                        typeof args[0][0] === "number") {
                        let bytes = args[0];
                        bytes = [...bytes].reverse();
                        value = change_wordsize(bytes, 8, uli_WORDSIZE);
                        if (uli_iszero(value)) {
                            sign = 0;
                        } else {
                            sign = 1;
                        }
                        // Number.
                    } else if (ofType(args[0], "number")) {
                        const limbs = args[0];
                        sign = 0;
                        value = uli_newarray(limbs);
                        // Hexadecimal string.
                    } else if (ofType(args[0], "string")) {
                        let hex = args[0];
                        let i = 0;
                        // Set the sign.
                        if (hex[i] === "-") {
                            sign = -1;
                            i++;
                        } else {
                            sign = 1;
                        }
                        // Ignore leading zeros.
                        while (i < hex.length && hex[i] === "0") {
                            i++;
                        }
                        // Set to zero or shorten input as appropriate.
                        if (i === hex.length) {
                            sign = 0;
                            hex = "00";
                        } else {
                            hex = hex.substring(i, hex.length);
                        }
                        // Convert to an array of bytes in reverse order and of proper
                        // wordsize.
                        const array = hexToByteArray(hex).reverse();
                        value = change_wordsize(array, 8, uli_WORDSIZE);
                    } else {
                        throw Error("Invalid parameters!");
                    }
                    // Sign and value, or length and random source.
                } else if (args.length == 2) {
                    // Sign and value as an array of words.
                    if (ofType(args[1], "array")) {
                        sign = args[0];
                        value = args[1];
                        if (Math.abs(sign) > 1) {
                            throw Error("Illegal sign!");
                        }
                        for (let i = 0; i < value.length; i++) {
                            if ((value[i] & 0xfffffff) !== value[i]) {
                                throw Error("Illegal word at index " + i + "!");
                            }
                        }
                        if (uli_iszero(value) && sign !== 0) {
                            throw Error("A zero array must have a zero sign!");
                        } else if (!uli_iszero(value) && sign === 0) {
                            throw Error("A non-zero array must have a non-zero sign!");
                        }
                        // Bit length and RandomSource.
                    } else {
                        const bitLength = args[0];
                        const randomSource = args[1];
                        if (bitLength < 1) {
                            throw Error("Attempting to sample non-positive " +
                                "bit length!");
                        }
                        const byteLength = LI.byteLengthRandom(bitLength);
                        const topZeros = (8 - bitLength % 8) % 8;
                        const data = randomSource.getBytes(byteLength);
                        data[0] &= 0xFF >>> topZeros;
                        const reversed = data.reverse();
                        value =
                            change_wordsize(reversed, 8, uli_WORDSIZE);
                        if (uli_iszero(value)) {
                            sign = 0;
                        } else {
                            sign = 1;
                        }
                    }
                } else {
                    throw Error("Wrong number of parameters! (" +
                        args.length + " instead of 1 or 2)");
                }
                this.sign = sign;
                this.value = value;
                this.length = this.value.length;
            }
            /* eslint-enable sonarjs/cognitive-complexity */
            /* eslint-enable @typescript-eslint/no-explicit-any */
            /**
             * Compares this integer with the input.
             *
             * @param other - Other integer.
             * @returns -1, 0, or 1 depending on if this integer is smaller than,
             * equal to, or greater than the input.
             */
            cmp(other) {
                return li_cmp(this, other);
            }
            /**
             * Checks if this integer is equal to the input.
             *
             * @param other - Other integer.
             * @returns true if and only if this integer equals the input.
             */
            equals(other) {
                return li_equals(this, other);
            }
            /**
             * Checks if this integer is zero.
             * @returns true or false depending on if this is zero or not.
             */
            iszero() {
                return li_iszero(this);
            }
            /**
             * Bit length of this integer.
             * @returns Bit length of this integer.
             */
            bitLength() {
                return uli_msbit(this.value) + 1;
            }
            /**
             * Returns 1 or 0 depending on if the given bit is set or
             * not.
             *
             * @param index - Position of bit.
             * @returns 1 or 0 depending on if the given bit is set or not.
             */
            getBit(index) {
                return uli_getbit(this.value, index);
            }
            /**
             * Returns the absolute value of this integer.
             * @returns Absolute value of this integer.
             */
            abs() {
                return new LI(1, uli_copyarray(this.value));
            }
            /**
             * Shifts this integer to the left.
             *
             * @param offset - Bit positions to shift.
             * @returns This integer shifted the given number of bits to the left.
             */
            shiftLeft(offset) {
                const len = this.length +
                    Math.floor((offset + uli_WORDSIZE - 1) / uli_WORDSIZE);
                const value = uli_copyarray(this.value);
                uli_resize(value, len);
                uli_shiftleft(value, offset);
                return new LI(this.sign, value);
            }
            /**
             * Shifts this integer to the right.
             *
             * @param offset - Bit positions to shift.
             * @returns This integer shifted the given number of bits to the right.
             */
            shiftRight(offset) {
                const value = uli_copyarray(this.value);
                uli_shiftright(value, offset);
                uli_normalize(value);
                let sign = this.sign;
                if (uli_iszero(value)) {
                    sign = 0;
                }
                return new LI(sign, value);
            }
            /**
             * Returns negative of this integer.
             * @returns -this.
             */
            neg() {
                return new LI((-this.sign), uli_copyarray(this.value));
            }
            /**
             * Computes sum of this integer and the input.
             *
             * @param term - Other integer.
             * @returns this + term.
             */
            add(term) {
                const len = Math.max(this.length, term.length) + 1;
                const res = new LI(len);
                li_add(res, this, term);
                li_normalize(res);
                return res;
            }
            /**
             * Computes difference of this integer and the input.
             *
             * @param term - Other integer.
             * @returns this - term.
             */
            sub(term) {
                const len = Math.max(this.length, term.length) + 1;
                const res = new LI(len);
                li_sub(res, this, term);
                li_normalize(res);
                return res;
            }
            /**
             * Computes product of this integer and the input.
             *
             * @param factor - Other integer.
             * @returns this * term.
             */
            mul(factor) {
                const len = this.length + factor.length;
                const res = new LI(len);
                li_mul(res, this, factor);
                li_normalize(res);
                return res;
            }
            /**
             * Computes square of this integer.
             * @returns this * this.
             */
            square() {
                const len = 2 * this.length;
                const res = new LI(len);
                li_square(res, this);
                li_normalize(res);
                return res;
            }
            /**
             * Returns [q, r] such that q = this / divisor + r with
             * this / divisor and r rounded with sign, in particular, if divisor
             * is positive, then 0 <= r < divisor.
             *
             * @param divisor - Divisor.
             * @returns Quotient and divisor.
             */
            divQR(divisor) {
                if (divisor.sign === 0) {
                    throw Error("Attempt to divide by zero!");
                }
                const dlen = divisor.length;
                // Copy this with extra space, since li_div_qr is destructive.
                const remainder = new LI(Math.max(this.length, dlen) + 2);
                li_set(remainder, this);
                // Make room for quotient.
                const qlen = Math.max(remainder.length - dlen, dlen, 0) + 1;
                const quotient = new LI(qlen);
                // Compute result.
                li_div_qr(quotient, remainder, divisor);
                li_normalize(quotient);
                li_normalize(remainder);
                return [quotient, remainder];
            }
            /**
             * Computes integer quotient of this integer and the
             * input.
             *
             * @param divisor - Integer divisor.
             * @returns this / divisor for positive integers with rounding
             * according to signs.
             */
            div(divisor) {
                return this.divQR(divisor)[0];
            }
            /**
             * Computes integer remainder of this integer divided by
             * the input as a value in [0, modulus - 1].
             *
             * @param modulus - Divisor.
             * @returns Integer remainder.
             */
            mod(modulus) {
                return this.divQR(modulus)[1];
            }
            /**
             * Computes modular sum when this integer and the first
             * input are non-negative and the last input is positive.
             *
             * @param term - Other integer.
             * @param modulus - Modulus.
             * @returns (this + term) mod modulus.
             */
            modAdd(term, modulus) {
                return this.add(term).mod(modulus);
            }
            /**
             * Computes modular difference when this integer and the
             * first input are non-negative and the last input is positive.
             *
             * @param term - Other integer.
             * @param modulus - Modulus.
             * @returns (this - term) mod modulus.
             */
            modSub(term, modulus) {
                return this.sub(term).mod(modulus);
            }
            /**
             * Computes modular product when this integer and the first
             * input are non-negative and the last input is positive.
             *
             * @param term - Other integer.
             * @param modulus - Modulus.
             * @returns (this * term) mod modulus.
             */
            modMul(factor, modulus) {
                return this.mul(factor).mod(modulus);
            }
            /**
             * Computes modular power of this integer raised to the exponent
             * modulo the given modulus. This integer must be non-negative.
             *
             * @param exponent - Non-negative exponent.
             * @param modulus - Integer greater than one.
             * @param alg - Algorithm used. Montgomery exponentiation throws
             * an error if the modulus is even.
             * @returns this ^ exponent mod modulus for positive integers.
             */
            modPow(exponent, modulus, alg = ModPowAlg.window) {
                if (modulus.sign <= 0) {
                    throw Error("Non-positive modulus! (" +
                        modulus.toHexString() + ")");
                }
                // modulus > 0
                if (this.sign < 0) {
                    throw Error("Negative basis! (" + this.toHexString() + ")");
                }
                // modulus > 0 and 0 <= this
                if (exponent.sign < 0) {
                    throw Error("Negative exponent! (" + exponent.toHexString() + ")");
                }
                // modulus > 0 and 0 <= this and exponent >= 0
                const w = uli_newarray(modulus.value.length);
                let b = this.value;
                const e = exponent.value;
                const m = modulus.value;
                // m > 0, 0 <= b, and e >= 0
                // 0 <= b < m and b has the same number of limbs as m.
                if (uli_cmp(b, m) >= 0) {
                    b = this.divQR(modulus)[1].value;
                    uli_resize(b, m.length);
                } else if (b.length < m.length) {
                    b = uli_newarray(m.length);
                    uli_set(b, this.value);
                }
                // m > 0, 0 <= b < m, and e >= 0
                // b^e mod 1 = 0 for every 0 <= b < m and e >= 0.
                if (modulus.equals(LI.ONE)) {
                    return LI.ZERO;
                }
                // m > 1, 0 <= b < m, and e >= 0
                // b^0 mod m = 1 if b >= 0 and m > 0.
                if (exponent.sign === 0) {
                    return LI.ONE;
                }
                // m > 1, 0 <= b < m, and e > 0
                // 0^e mod m = 0 if e > 0 and m > 1.
                if (uli_iszero(b)) {
                    return LI.ZERO;
                }
                // m > 1, 0 < b < m, and e > 0
                switch (alg) {
                    // Square and multiply.
                    case ModPowAlg.naive:
                        uli_modpow_naive(w, b, e, m);
                        break;
                        // Windowing exponentiation.
                    case ModPowAlg.window:
                        uli_modpow(w, b, e, m);
                        break;
                        // Montgomery exponentiation requires an odd modulus.
                    case ModPowAlg.montgomery:
                        if ((m[0] & 0x1) == 1) {
                            li_modpow_mont(w, b, e, m);
                        } else {
                            throw Error("Montgomery exponentiation does not work" +
                                "for even moduli! (m = 0x" + uli_hex(m) + ")");
                        }
                        break;
                }
                if (uli_iszero(w)) {
                    return LI.ZERO;
                } else {
                    uli_normalize(w);
                    return new LI(1, w);
                }
            }
            /**
             * Computes extended greatest common divisor.
             *
             * @param other - Other integer.
             * @returns Array [a, b, v] such that a * this + b * other = v and v is
             * the greatest common divisor of this and other.
             */
            egcd(other) {
                const len = Math.max(this.length, other.length) + 1;
                const a = new LI(len);
                const b = new LI(len);
                const v = new LI(len);
                li_egcd(a, b, v, this, other);
                li_normalize(a);
                li_normalize(b);
                li_normalize(v);
                return [a, b, v];
            }
            /**
             * Computes modular inverse of this integer modulo the
             * input prime.
             *
             * @param prime - Odd positive prime integer.
             * @returns Integer x such that x * this = 1 mod prime, where 0
             * <= x < prime.
             */
            modInv(prime) {
                // There is no need to optimize this by using a stripped extended
                // greatest common divisor algorithm.
                const a = this.egcd(prime)[0];
                if (a.sign < 0) {
                    return prime.add(a);
                } else {
                    return a;
                }
            }
            /**
             * Returns (this | prime), i.e., the Legendre symbol of
             * this modulo prime for an odd prime prime. (This is essentially a
             * GCD algorithm that keeps track of the symbol.)
             *
             * @param prime - An odd prime modulus.
             * @returns Legendre symbol of this instance modulo the input.
             */
            legendre(prime) {
                return li_legendre(this.mod(prime), prime);
            }
            /**
             * Returns a square root of this integer modulo an odd
             * prime, where this integer is a quadratic residue modulo the prime.
             *
             * @param prime - An odd prime modulus.
             * @returns Square root of this integer modulo the input odd prime.
             */
            modSqrt(prime) {
                const res = new LI(prime.length);
                li_modsqrt(res, this, prime);
                li_normalize(res);
                return res;
            }
            /**
             * Returns the bits between the start index and end index
             * as an integer.
             *
             * @param start - Inclusive start index.
             * @param end - Exclusive end index.
             * @returns Bits between the start index and end index as an integer.
             */
            slice(start, end) {
                const value = uli_slice(this.value, start, end);
                let sign = this.sign;
                if (uli_iszero(value)) {
                    sign = 0;
                }
                return new LI(sign, value);
            }
            /**
             * Computes a byte array that represents the absolute
             * value of this integer. The parameter can be used to truncate the
             * most significant bytes or to ensure that a given number of bytes
             * are used, effectively padding the representation with zeros.
             *
             * @param byteSize - Number of bytes used in output.
             * @returns Resulting array.
             */
            toByteArray(byteSize) {
                const MASK_TOP_8 = 0x80;
                // Convert the representation with uli_WORDSIZE words into a
                // representation with 8-bit words.
                /* eslint-disable @typescript-eslint/no-explicit-any */
                const dense = change_wordsize(this.value, uli_WORDSIZE, 8);
                /* eslint-enable @typescript-eslint/no-explicit-any */
                if (typeof byteSize === "undefined") {
                    // Remove or add as many leading bytes as needed.
                    uli_normalize(dense, MASK_TOP_8);
                } else {
                    // Reduce/increase the number of bytes as requested.
                    uli_resize(dense, byteSize);
                }
                return dense.reverse();
            }
            /**
             * Computes a hexadecimal representation of this integer.
             * @returns Hexadecimal representation of this integer.
             */
            toHexString() {
                return li_hex(this);
            }
            /**
             * Returns the number of bytes needed to generate the
             * given number of bits.
             *
             * @param bitLength - Number of bits.
             * @returns Number of bytes needed.
             */
            static byteLengthRandom(bitLength) {
                return Math.floor((bitLength + 7) / 8);
            }
        }
        /**
         * Representation of zero.
         */
        LI.ZERO = new LI(0, [0]);
        /**
         * Representation of one.
         */
        LI.ONE = new LI(1, [1]);
        /**
         * Representation of two.
         */
        LI.TWO = new LI(1, [2]);
        arithm.LI = LI;
        /**
         * Pre-computes values to be used for simultaneous exponentiation for
         * a given list b of k bases and a modulus m. The method {@link
         * ModPowProd.modPowProd} then takes a list of exponents e and outputs
         * the modular power product
         *
         * <p>
         *
         * g[0] ^ e[0] * ... * g[k - 1] ^ e[k - 1] mod m.
         *
         * <p>
         *
         * The number of exponents must match the number of bases for which
         * pre-computation is performed.
         *
         * @param bases - List of bases.
         * @param modulus - Modulus.
         */
        class ModPowProd {
            constructor(bases, modulus, width) {
                const b = [];
                for (let i = 0; i < bases.length; i++) {
                    b[i] = bases[i].value;
                }
                this.noBases = bases.length;
                this.modulus = modulus;
                this.width = Math.min(width, ModPowProd.maxWidth);
                this.t = modpowprodtab(b, modulus.value, this.width);
            }
            /**
             * Computes a power-product using the given exponents.
             *
             * @param exponents - Exponents.
             * @returns Power product.
             */
            modPowProd(exponents) {
                if (exponents.length !== this.noBases) {
                    throw Error("Wrong number of exponents! (" +
                        exponents.length + " != " + this.noBases + ")");
                }
                const e = [];
                for (let i = 0; i < exponents.length; i++) {
                    e[i] = exponents[i].value;
                }
                const res = new LI(this.modulus.length);
                modpowprod(res.value, this.t, e, this.modulus.value, this.width);
                if (iszero(res.value)) {
                    res.sign = 0;
                } else {
                    res.sign = 1;
                }
                normalize(res.value);
                return res;
            }
        }
        ModPowProd.maxWidth = 16;
        arithm.ModPowProd = ModPowProd;
        /**
         * Fixed-basis exponentiation based on simultantaneous
         * exponentiation with exponent slicing.
         *
         * @param basis - Basis.
         * @param modulus - Modulus.
         * @param size - Expected number of exponentiations to compute.
         * @param width - If given this determines the width of the pre-computed
         * table, and otherwise it is chosen theoretically optimally.
         */
        class FixModPow {
            constructor(basis, modulus, size, width) {
                const bitLength = modulus.bitLength();
                if (typeof width === "undefined") {
                    width = FixModPow.optimalWidth(bitLength, size);
                }
                // Determine the number of bits associated with each bases.
                this.sliceSize = Math.floor((bitLength + width - 1) / width);
                // Create radix element.
                const powerBasis = LI.ONE.shiftLeft(this.sliceSize);
                // Create generators.
                const bases = [];
                bases[0] = basis;
                for (let i = 1; i < width; i++) {
                    bases[i] = bases[i - 1].modPow(powerBasis, modulus);
                }
                // Invoke the pre-computation of the simultaneous exponentiation
                // code.
                this.mpp = new ModPowProd(bases, modulus, width);
            }
            /**
             * Cuts an input integer into the appropriate number of
             * slices and outputs a list of integers such that the ith bit belongs
             * to the ith slice.
             *
             * @param exponent - Exponent.
             * @returns Array of exponents.
             */
            slice(exponent) {
                const exponents = [];
                const bitLength = exponent.bitLength();
                let offset = 0;
                let i = 0;
                while (i < this.mpp.width - 1 && offset < bitLength) {
                    exponents[i] = exponent.slice(offset, offset + this.sliceSize);
                    offset += this.sliceSize;
                    i++;
                }
                // There is no bound on the bit size of the last slice.
                if (offset < bitLength) {
                    exponents[i] = exponent.slice(offset, bitLength);
                    offset += this.sliceSize;
                    i++;
                }
                while (i < this.mpp.width) {
                    exponents[i] = LI.ZERO;
                    i++;
                }
                return exponents;
            }
            /**
             * Raises the fixed basis to the given exponent given the
             * fixed modulus.
             *
             * @param exponent - Exponent.
             * @returns Power of fixed basis to the given exponent.
             */
            modPow(exponent) {
                return this.mpp.modPowProd(this.slice(exponent));
            }
            /**
             * Takes the bit length of the exponents and the number
             * of exponentiations that we expect to compute and returns the
             * theoretically optimal width.
             *
             * @param bitLength - Expected bit length of exponents.
             * @param size - Expected number of exponentiations to compute.
             * @returns Theoretically optimal choice of width for the expected bit
             * length and number of exponentiations.
             */
            static optimalWidth(bitLength, size) {
                let width = 2;
                let cost = 1.5 * bitLength;
                let oldCost;
                do {
                    oldCost = cost;
                    // Amortized cost for table.
                    const t = ((1 << width) - width + bitLength) / size;
                    // Cost for multiplication.
                    const m = bitLength / width;
                    cost = t + m;
                    width++;
                } while (width <= 16 && cost < oldCost);
                // We reduce the theoretical value by one to account for the
                // overhead.
                return width - 1;
            }
        }
        arithm.FixModPow = FixModPow;
    })(arithm = verificatum.arithm || (verificatum.arithm = {}));
    let algebra;
    (function(algebra) {
        let ec;
        (function(ec) {
            var SLI = verificatum.arithm.li.SLI;
            var add = verificatum.arithm.li.add;
            var cmp = verificatum.arithm.li.cmp;
            var copy = verificatum.arithm.li.copy;
            var equals = verificatum.arithm.li.equals;
            var getbit = verificatum.arithm.uli.getbit;
            var iszero = verificatum.arithm.li.iszero;
            var mod = verificatum.arithm.li.mod;
            var modinv = verificatum.arithm.li.modinv;
            var msbit = verificatum.arithm.uli.msbit;
            var mul = verificatum.arithm.li.mul;
            var mul_word = verificatum.arithm.li.mul_word;
            var resize = verificatum.arithm.li.resize;
            var set = verificatum.arithm.li.set;
            var shiftleft = verificatum.arithm.li.shiftleft;
            var sub = verificatum.arithm.li.sub;
            /**
             * Raw container class for elliptic curves.
             *
             * <p>
             *
             * ASSUMES: 0 <= a, b, gx, gy < modulus, n > 0, and x^3 + b * x + a
             * (mod modulus) is a non-singular curve of order n.
             *
             * @param modulus - Modulus for underlying field.
             * @param a - First coefficient for curve of Weierstrass normal form.
             * @param b - Second coefficientfor curve of Weierstrass normal form.
             * @param n - Order of elliptic curve.
             */
            class EC {
                constructor(modulus, a, b) {
                    this.modulus = modulus;
                    // For simplicity we use a fixed length for all variables. This
                    // allows computing a single product and a few additions and
                    // subtractions as needed below.
                    this.length = 2 * this.modulus.value.length + 4;
                    this.a = a;
                    this.b = b;
                    // Use faster doubling algorithm if a = modulus - 3.
                    const three = new SLI(1, [3]);
                    const t = new SLI(modulus.length + 1);
                    add(t, this.a, three);
                    if (equals(this.modulus, t)) {
                        this.jdbl_raw = ec.jdbl_a_eq_neg3;
                    } else {
                        this.jdbl_raw = ec.jdbl_generic;
                    }
                }
                /**
                 * Changes the representation of the point to canonical
                 * coordinates, i.e. the unique representation where z is 1 and (x,y)
                 * is the corresponding affine point. The exception is the point at
                 * infinity which is left unchanged.
                 *
                 * @param A - Point to affine.
                 */
                affine(A) {
                    ec.affine_raw(this, A);
                }
                /**
                 * Compares A and B.
                 *
                 * @param A - Left point on curve.
                 * @param B - Right point on curve.
                 * @returns true or false depending on if A and B represent the same
                 * point on the curve or not.
                 */
                equals(A, B) {
                    this.affine(A);
                    this.affine(B);
                    return cmp(A.x, B.x) === 0 &&
                        cmp(A.y, B.y) === 0 &&
                        cmp(A.z, B.z) === 0;
                }
                /**
                 * Sets A = B.
                 *
                 * @param A - Holder of result.
                 * @param B - Point on curve.
                 */
                set(A, B) {
                    set(A.x, B.x);
                    set(A.y, B.y);
                    set(A.z, B.z);
                }
                /**
                 * Sets A = O, where O is the unit element of the
                 * elliptic curve.
                 *
                 * @param A - Holder of result.
                 */
                setzero(A) {
                    set(A.x, 0);
                    set(A.y, 1);
                    set(A.z, 0);
                }
                /**
                 * Sets A = -B.
                 *
                 * @param A - Holder of result.
                 * @param B - Point on curve.
                 */
                neg(A, B) {
                    // If B is the unit element, or if it is not, but it is its own
                    // negative, then we set A = B.
                    if (iszero(B.z) || iszero(B.y)) {
                        this.set(A, B);
                        // Otherwise we mirror along the y-axis.
                    } else {
                        set(A.x, B.x);
                        sub(A.y, this.modulus, B.y);
                        set(A.z, B.z);
                    }
                }
                /**
                 * Sets A = B + C.
                 *
                 * @param A - Holder of result.
                 * @param B - Point on curve.
                 * @param C - Point on curve.
                 */
                jadd(A, B, C) {
                    ec.jadd_generic(this, A, B, C);
                }
                /**
                 * Sets A = 2 * B.
                 *
                 * @param A - Holder of result.
                 * @param B - Point on curve.
                 */
                jdbl(A, B) {
                    this.jdbl_raw(this, A, B);
                }
                /**
                 * Sets A = e * B.
                 *
                 * @param A - Holder of result.
                 * @param B - Point on curve.
                 * @param e - Scalar.
                 */
                jmul(A, B, e) {
                    jmul_naive(this, A, B, e);
                }
            }
            ec.EC = EC;
            /**
             * Container class for raw elliptic curve points.
             * @param len - Number of limbs to be used to represent the coordinates
             * of the point.
             *
             * @param x - x-coordinate of point on the curve.
             * @param y - y-coordinate of point on the curve.
             * @param z - z-coordinate of point on the curve.
             */
            class ECP {
                constructor(len, x, y, z) {
                    if (typeof x === "undefined" ||
                        typeof y === "undefined" ||
                        typeof z === "undefined") {
                        this.x = new SLI(len);
                        this.y = new SLI(len);
                        this.z = new SLI(len);
                    } else {
                        this.x = copy(x, len);
                        this.y = copy(y, len);
                        this.z = copy(z, len);
                    }
                }
            }
            ec.ECP = ECP;
            /**
             * Raw implementation of elliptic curves over prime order fields in
             * Jacobi coordinates, i.e., the affine coordinates (x, y) corresponds
             * to the projective coordinates (X * Z^2, Y * Z^3, Z).
             *
             * <p>
             *
             * Here elliptic curve points do not follow the object oriented
             * pattern with methods for adding, doubling, and multiplying. Instead
             * this is implemented in methods of the curve, or even plain
             * functions. This avoids allocations. Thus, the API is half-way
             * between different paradigms and the routines in this library are
             * not meant to be used directly.
             *
             * <p>
             *
             * The implementation is close to a verbatim port of the corresponding
             * code in the Verificatum Elliptic Curve library (VEC) written in
             * C. In particular, the addition and doubling routines have been
             * translated by search and replace.
             *
             * <p>
             *
             * All coordinates of elliptic curve points and temporary values are
             * stored using L = 2 * L' + 4 limbs, where L' is equal to the minimal
             * number of limbs needed to represent the order of the underlying
             * field.
             *
             * <p>
             *
             * The addition and doubling routines have full-multiplication depth 1
             * before every modular reduction. There may also be a few additions
             * or multiplication with integers bounded by 8. Such expressions fit
             * nicely into L limbs. After modular reduction L' words remain and
             * new expressions can be formed. This approach reduces the number of
             * modular reductions.
             * TSDOC_MODULE
             */
            /**
             * Changes the representation of the point to canonical
             * coordinates, i.e. the unique representation where z is 1 and (x,y)
             * is the corresponding affine point. The exception is the point at
             * infinity which is left unchanged.
             *
             * @param curve - Elliptic curve.
             * @param A - Point to affine.
             */
            ec.affine_raw = (function() {
                // Temporary space for storing powers of inverses.
                const I = new SLI();
                const II = new SLI();
                const III = new SLI();
                return function(curve, A) {
                    // Resize temporary space if needed.
                    if (I.length !== curve.length) {
                        resize(I, curve.length);
                        resize(II, curve.length);
                        resize(III, curve.length);
                    }
                    // We only consider points that map to affine points.
                    if (!iszero(A.z)) {
                        modinv(I, A.z, curve.modulus); // I = 1 / A.z
                        mul(II, I, I); // II = 1 / A.z^2
                        mod(II, II, curve.modulus);
                        mul(III, II, I); // III = 1 / A.z^3
                        mod(III, III, curve.modulus);
                        mul(A.x, A.x, II); // A.x = A.x / A.z^2
                        mod(A.x, A.x, curve.modulus);
                        mul(A.y, A.y, III); // A.y = A.y / A.z^3
                        mod(A.y, A.y, curve.modulus);
                        set(A.z, 1); // A.z = 1
                    }
                };
            })();
            /**
             * Sets A = B + C.
             *
             * @param curve - Elliptic curve.
             * @param A - Holder of result.
             * @param B - Point on curve.
             * @param C - Point on curve.
             */
            ec.jadd_generic = (function() {
                // Temporary variables with exactly the same number of limbs as
                // the modulus of the underlying field.
                const t1 = new SLI();
                const t2 = new SLI();
                const t3 = new SLI();
                const U1 = new SLI();
                const U2 = new SLI();
                const S1 = new SLI();
                const S2 = new SLI();
                const H = new SLI();
                const r = new SLI();
                return function(curve, A, B, C) {
                    const modulus = curve.modulus;
                    const len = curve.length;
                    if (t1.length !== len) {
                        resize(t1, len);
                        resize(t2, len);
                        resize(t3, len);
                        resize(U1, len);
                        resize(U2, len);
                        resize(S1, len);
                        resize(S2, len);
                        resize(H, len);
                        resize(r, len);
                    }
                    // B is point at infinity.
                    if (iszero(B.z)) {
                        // C is also point at infinity.
                        if (iszero(C.z)) {
                            curve.setzero(A);
                            return;
                            // B is point at infinity and C is not.
                        } else {
                            curve.set(A, C);
                            return;
                        }
                        // C is point at infinity and B is not.
                    } else if (iszero(C.z)) {
                        curve.set(A, B);
                        return;
                    }
                    // Compute powers of C.z.
                    mul(t1, C.z, C.z); // t1 = C.z^2
                    mod(t1, t1, modulus);
                    mul(S2, t1, C.z); // S2 = C.z^3
                    mod(S2, S2, modulus);
                    // Compute powers of B.z
                    mul(t2, B.z, B.z); // t2 = B.z^2
                    mod(t2, t2, modulus);
                    mul(t3, t2, B.z); // t3 = B.z^3
                    mod(t3, t3, modulus);
                    // U1 = B.x * C.z^2
                    mul(U1, B.x, t1);
                    mod(U1, U1, modulus);
                    // U2 = C.x * B.z^2
                    mul(U2, C.x, t2);
                    // S1 = B.y * C.z^3
                    mul(S1, B.y, S2);
                    mod(S1, S1, modulus);
                    // S2 = C.y * B.z^3
                    mul(S2, C.y, t3);
                    // H = U2 - U1
                    sub(H, U2, U1);
                    mod(H, H, modulus);
                    // r = S2 - S1
                    sub(r, S2, S1);
                    mod(r, r, modulus);
                    if (iszero(H)) {
                        if (iszero(r)) {
                            curve.jdbl_raw(curve, A, B);
                            return;
                        } else {
                            curve.setzero(A);
                            return;
                        }
                    }
                    // Compute square of r
                    mul(t1, r, r); // t1 = r^2
                    mod(t1, t1, modulus);
                    // Compute powers of H
                    mul(t2, H, H); // t2 = H^2
                    mod(t2, t2, modulus);
                    mul(t3, t2, H); // t3 = H^3
                    mod(t3, t3, modulus);
                    // A.x = -H^3 - 2 * U1 * H^2 + r^2
                    sub(A.x, t1, t3); // A.x = r^2 - H^3
                    mul(t1, U1, t2); // t1 = 2*U1*H^2
                    shiftleft(t1, 1); // mul_word(t1, t1, 2);
                    mod(t1, t1, modulus);
                    sub(A.x, A.x, t1);
                    mod(A.x, A.x, modulus);
                    // A.y = -S1 * H^3 + r * (U1 * H^2 - A.x)
                    mul(t1, U1, t2); // t1 = r*(U1*H^2-A.x)
                    mod(t1, t1, modulus);
                    sub(t1, t1, A.x);
                    mul(t1, r, t1);
                    mod(t1, t1, modulus);
                    mul(t2, S1, t3); // t2 = S1*H^3
                    mod(t2, t2, modulus);
                    sub(A.y, t1, t2);
                    mod(A.y, A.y, modulus);
                    // A.z = B.z * C.z * H
                    mul(A.z, B.z, C.z);
                    mod(A.z, A.z, modulus);
                    mul(A.z, A.z, H);
                    mod(A.z, A.z, modulus);
                };
            })();
            /**
             * Sets A = 2 * B.
             * <p>
             * References: Cohen/Miyaji/Ono Jacobi coordinates (1998).
             *
             * @param curve - Elliptic curve.
             * @param A - Holder of result.
             * @param B - Point on curve.
             */
            ec.jdbl_generic = (function() {
                // Temporary variables with exactly the same number of limbs as
                // the modulus of the underlying field.
                const t1 = new SLI();
                const t2 = new SLI();
                const t3 = new SLI();
                const S = new SLI();
                const M = new SLI();
                const T = new SLI();
                return function(curve, A, B) {
                    const modulus = curve.modulus;
                    const len = curve.length;
                    if (t1.length !== len) {
                        resize(t1, len);
                        resize(t2, len);
                        resize(t3, len);
                        resize(S, len);
                        resize(M, len);
                        resize(T, len);
                    }
                    // B is point at infinity or point which is its own inverse.
                    if (iszero(B.z) || iszero(B.y)) {
                        curve.setzero(A);
                        return;
                    }
                    // S = 4*B.x*B.y^2
                    mul(S, B.y, B.y);
                    mod(S, S, modulus);
                    mul(S, S, B.x);
                    shiftleft(S, 2); // mul_word(S, S, 4);
                    mod(S, S, modulus);
                    // B.z squared
                    mul(t2, B.z, B.z); // t2 = B.z^2
                    mod(t2, t2, modulus);
                    // M = 3*B.x^2+a*B.z^4
                    mul(t1, B.x, B.x); // t1 = 3*B.x^2
                    mod(t1, t1, modulus);
                    mul_word(t1, t1, 3);
                    mod(t1, t1, modulus);
                    mul(t3, t2, t2); // t3 = a*B.z^4
                    mod(t3, t3, modulus);
                    mul(t3, t3, curve.a);
                    mod(t3, t3, modulus);
                    add(M, t1, t3);
                    mod(M, M, modulus);
                    // T = M^2-2*S
                    mul(T, M, M);
                    set(t2, S); // mul_word(t2, S, 2);
                    shiftleft(t2, 1);
                    sub(T, T, t2);
                    mod(T, T, modulus);
                    // A.x = T
                    set(A.x, T);
                    // A.y = -8*B.y^4+M*(S-T)
                    sub(t1, S, T); // t1 = M*(S-T)
                    mul(t1, t1, M);
                    mod(t1, t1, modulus);
                    mul(t2, B.y, B.y); // t2 = 8*B.y^4
                    mod(t2, t2, modulus);
                    mul(t2, t2, t2);
                    mod(t2, t2, modulus);
                    shiftleft(t2, 3); // mul_word(t2, t2, 8);
                    mod(t2, t2, modulus);
                    sub(t1, t1, t2);
                    // A.z = 2*B.y*B.z
                    mul(t2, B.y, B.z);
                    shiftleft(t2, 1); // mul_word(t2, t2, 2);
                    mod(A.y, t1, modulus);
                    mod(A.z, t2, modulus);
                };
            })();
            /**
             * Sets A = 2 * B.
             *
             * <p>
             *
             * ASSUMES: a = -3 for the curve.
             *
             * <p>
             *
             * References: Bernstein Jacobi coordinates (2001).
             *
             * @param curve - Elliptic curve.
             * @param A - Holder of result.
             * @param B - Point on curve.
             */
            ec.jdbl_a_eq_neg3 = (function() {
                // Temporary variables with exactly the same number of limbs as
                // the modulus of the underlying field.
                const t1 = new SLI();
                const t2 = new SLI();
                const t3 = new SLI();
                const alpha = new SLI();
                const beta = new SLI();
                const gamma = new SLI();
                const delta = new SLI();
                return function(curve, A, B) {
                    const modulus = curve.modulus;
                    const len = curve.length;
                    if (t1.length !== len) {
                        resize(t1, len);
                        resize(t2, len);
                        resize(t3, len);
                        resize(alpha, len);
                        resize(beta, len);
                        resize(gamma, len);
                        resize(delta, len);
                    }
                    // B is point at infinity or point which is its own negative.
                    if (iszero(B.z) || iszero(B.y)) {
                        curve.setzero(A);
                        return;
                    }
                    // delta = B.z^2
                    mul(delta, B.z, B.z);
                    mod(delta, delta, modulus);
                    // gamma = B.y^2
                    mul(gamma, B.y, B.y);
                    mod(gamma, gamma, modulus);
                    // beta = B.x * gamma
                    mul(beta, B.x, gamma);
                    mod(beta, beta, modulus);
                    // alpha = 3 * (B.x - delta) * (B.x + delta)
                    sub(t1, B.x, delta);
                    add(t2, B.x, delta);
                    mul_word(t1, t1, 3);
                    mul(alpha, t1, t2);
                    mod(alpha, alpha, modulus);
                    // A.x = alpha^2 - 8 * beta
                    mul(t1, alpha, alpha);
                    set(t2, beta); // mul_word(t2, beta, 8);
                    shiftleft(t2, 3);
                    sub(A.x, t1, t2);
                    mod(A.x, A.x, modulus);
                    // A.z = (B.y + B.z)^2 - gamma - delta
                    add(t1, B.y, B.z);
                    mul(t1, t1, t1);
                    sub(t1, t1, gamma);
                    sub(t1, t1, delta);
                    mod(A.z, t1, modulus);
                    // A.y = alpha * (4 * beta - A.x) - 8 * gamma^2
                    set(t1, beta); // mul_word(t1, beta, 4);
                    shiftleft(t1, 2);
                    sub(t1, t1, A.x);
                    mul(t1, t1, alpha);
                    mul(t2, gamma, gamma);
                    shiftleft(t2, 3); // mul_word(t2, t2, 8);
                    sub(A.y, t1, t2);
                    mod(A.y, A.y, modulus);
                };
            })();
            /**
             * Sets A = e * B.
             *
             * <p>
             *
             * @param curve - Elliptic curve.
             * @param A - Holder of result.
             * @param B - Point on curve.
             * @param e - Scalar.
             */
            function jmul_naive(curve, A, B, e) {
                // Index of most significant bit.
                const n = msbit(e.value);
                curve.setzero(A);
                // Iterate through the remaining bits of e starting from the most
                // significant bit.
                for (let i = n; i >= 0; i--) {
                    // A = 2 * A
                    curve.jdbl(A, A);
                    if (getbit(e.value, i) === 1) {
                        // A = A + B
                        curve.jadd(A, A, B);
                    }
                }
            }
            ec.jmul_naive = jmul_naive;
        })(ec = algebra.ec || (algebra.ec = {}));
        var EC = verificatum.algebra.ec.EC;
        var ECP = verificatum.algebra.ec.ECP;
        var FixModPow = verificatum.arithm.FixModPow;
        var LI = verificatum.arithm.LI;
        var ModPowAlg = verificatum.arithm.ModPowAlg;
        var VerificatumObject = verificatum.base.VerificatumObject;
        var asciiToByteArray = verificatum.base.asciiToByteArray;
        var byteArrayToAscii = verificatum.base.byteArrayToAscii;
        var byteArrayToHex = verificatum.base.byteArrayToHex;
        var fill = verificatum.base.fill;
        var hex = verificatum.arithm.li.hex;
        var hexToByteArray = verificatum.base.hexToByteArray;
        var iszero = verificatum.arithm.li.iszero;
        var ofClass = verificatum.base.ofClass;
        var ofType = verificatum.base.ofType;
        var readUint16FromByteArray = verificatum.base.readUint16FromByteArray;
        var readUint32FromByteArray = verificatum.base.readUint32FromByteArray;
        var setUint16ToByteArray = verificatum.base.setUint16ToByteArray;
        var setUint32ToByteArray = verificatum.base.setUint32ToByteArray;
        class ByteTreeIndex {
            constructor(byteTree, index) {
                this.byteTree = byteTree;
                this.index = index;
            }
        }
        algebra.ByteTreeIndex = ByteTreeIndex;
        /**
         * Class for representing ordered trees of byte arrays. A
         * byte tree is represented as an array of bytes as follows.
         *
         * <ul>
         *
         * <li> A leaf holding a sequence of bytes B of length l is converted
         *      into a byte array T|L|B, where "|" denotes concatenation, T is
         *      a single byte equal to 1 indicating that this is a leaf, and L
         *      is a 32-bit signed integer representation of l.
         *
         * <li> A node holding children c_0,...,c_{l-1} is converted into a
         *      byte array T|L|C_0|...|C_{l-1}, where T is a single byte equal
         *      to 0 indicating that this is a node, L is a 32-bit unsigned
         *      integer representation of l and C_i is the representation of
         *      c_i as a byte array.
         *
         * </ul>
         *
         * In an alternative more compact representation the header T|L is
         * replace by t|f-1|L|p, where: (1) t is the least significant bit of
         * T, (2) f is the number of 4-bit blocks needed to represent L as an
         * unsigned integer, where f-1 is represented as a 3-bit unsigned
         * integer, (3) L is represented as an unsigned (f * 4)-bit integer,
         * and (4) p is 4 zeros or the empty sequence as needed to make the
         * complete the complete header t|f-1|L|p have a bit length that is a
         * multiple of 8.
         *
         * <p>
         *
         * The compact representation may be useful for external
         * representation of small byte trees with a complex structure as
         * short hexadecimal strings, but it is not used internally for
         * obvious efficiency reasons. The compact representation is enabled
         * throughout using the squeeze parameter.
         */
        class ByteTree {
            constructor(value, squeeze = false) {
                if (ofType(value, "string")) {
                    let s = value;
                    // Strip comment if present.
                    const start = s.indexOf("::");
                    if (start > 0) {
                        s = s.slice(start + 2);
                    }
                    // Recover byte tree from hex string.
                    const array = hexToByteArray(s);
                    const bt = ByteTree.readByteTreeFromByteArray(array, squeeze);
                    this.nodeType = bt.nodeType;
                    this.value = bt.value;
                } else if (squeeze) {
                    throw Error("The squeeze parameter is illegal unless the " +
                        "value is a string!");
                } else if (typeof value[0] === "number") {
                    this.nodeType = ByteTree.LEAF;
                    this.value = value;
                } else {
                    this.nodeType = ByteTree.NODE;
                    this.value = value;
                }
            }
            /**
             * Indicates if this byte tree is a leaf or not.
             * @returns True or false depending on if this byte tree is a leaf or not.
             */
            isLeaf() {
                return this.nodeType === ByteTree.LEAF;
            }
            /**
             * Computes the total number of bytes needed to represent
             * this byte tree as a byte array.
             * @returns Number of bytes needed to store a byte array representation
             * of this byte tree.
             */
            size() {
                if (this.nodeType === ByteTree.LEAF) {
                    return 1 + 4 + this.value.length;
                } else if (this.nodeType === ByteTree.NODE) {
                    let size = 1 + 4;
                    for (let i = 0; i < this.value.length; i++) {
                        size += this.value[i].size();
                    }
                    return size;
                } else {
                    throw Error("Unknown type! (" + this.nodeType + ")");
                }
            }
            /**
             * Sets the squeezed header bytes and returns the number of bytes
             * written.
             *
             * @param destination - Array to which bytes are written.
             * @param index - Index where we start to write.
             * @param length - Number of bytes or children depending of the
             * node type.
             * @returns Number of bytes written.
             */
            setSqueezedHeader(destination, index, length) {
                // Number of 4-bit blocks needed to represent length.
                let h = 8;
                let mask = 0xF0000000;
                while (h > 1 && (mask & length) == 0) {
                    h--;
                    mask >>>= 4;
                }
                // Node type in first bit and then (h - 1) in three bits, in a
                // 4-bit block.
                destination[index] = (0x8 * this.nodeType) | (h - 1);
                // Right shift needed for next block of length.
                let s = (h - 1) * 4;
                // Write all blocks.
                let even = 0;
                for (let i = 0; i < h; i++) {
                    destination[index] <<= 4;
                    destination[index] |= (length >>> s) & 0xF;
                    s -= 4;
                    even = 1 - (i & 0x1);
                    index += even;
                }
                if (even === 0) {
                    destination[index] <<= 4;
                }
                return (h + 2) >> 1;
            }
            /**
             * Sets the header bytes and returns the number of bytes written.
             *
             * @param destination - Array to which bytes are written.
             * @param index - Index where we start to write.
             * @param length - Number of bytes or children depending of the
             * node type.
             * @param squeeze - Determines if headers are squeezed or not.
             * @returns Number of bytes written.
             */
            setHeader(destination, index, length, squeeze = false) {
                if (squeeze) {
                    return this.setSqueezedHeader(destination, index, length);
                } else {
                    destination[index] = this.nodeType;
                    index++;
                    setUint32ToByteArray(destination, this.value.length, index);
                    return 5;
                }
            }
            /**
             * Writes a byte tree representation of this byte tree to
             * the destination starting at the given index.
             *
             * @param destination - Destination of written bytes.
             * @param index - Index of starting position.
             * @param squeeze - Determines if headers are squeezed or not.
             * @returns Number of bytes written.
             */
            setToByteArray(destination, index, squeeze = false) {
                const origIndex = index;
                if (this.nodeType === ByteTree.LEAF) {
                    index +=
                        this.setHeader(destination, index, this.value.length, squeeze);
                    const bytes = this.value;
                    for (let i = 0; i < bytes.length; i++) {
                        destination[index] = bytes[i];
                        index++;
                    }
                } else {
                    const children = this.value;
                    index +=
                        this.setHeader(destination, index, children.length, squeeze);
                    for (let i = 0; i < children.length; i++) {
                        index +=
                            children[i].setToByteArray(destination, index, squeeze);
                    }
                }
                return index - origIndex;
            }
            /**
             * Generates a representation of this byte tree as a byte
             * array.
             * @param squeeze - Determines if headers are squeezed or not.
             * @returns Representation of this byte tree as a byte array.
             */
            toByteArray(squeeze = false) {
                const array = [];
                this.setToByteArray(array, 0, squeeze);
                return array;
            }
            /**
             * Generates hexadecimal representation of this byte
             * tree.
             * @param squeeze - Determines if headers are squeezed or not.
             * @returns Hexadecimal representation of this byte tree.
             */
            toHexString(squeeze = false) {
                const ba = this.toByteArray(squeeze);
                return byteArrayToHex(ba);
            }
            // This is an internal function.
            toPrettyStringInner(indent) {
                if (this.nodeType === ByteTree.LEAF) {
                    const bytes = this.value;
                    return indent + "\"" + byteArrayToHex(bytes) + "\"";
                } else if (this.nodeType === ByteTree.NODE) {
                    const children = this.value;
                    let s = indent + "[\n";
                    for (let i = 0; i < children.length; i++) {
                        if (i > 0) {
                            s += ",\n";
                        }
                        s += children[i].toPrettyStringInner(indent + "    ");
                    }
                    s += "\n" + indent + "]";
                    return s;
                } else {
                    throw Error("Unknown type! (" + this.nodeType + ")");
                }
            }
            /**
             * Generates representation as a nested JSON list with
             * the leaves as hexadecimal string representations of the data in
             * leaves. This is meant for debugging.
             * @returns Pretty representation of this byte tree.
             */
            toPrettyString() {
                return this.toPrettyStringInner("");
            }
            /**
             * Recovers a byte tree from its representation as a byte
             * array from the given source. If the second parameter is given, then
             * reading starts at this position and a pair is returned. If no
             * second parameter is given, then the byte tree is simply returned.
             *
             * @param source - Array holding a representation of a byte tree.
             * @param index - Position in the array where reading starts.
             * @param squeeze - Determines if headers are squeezed or not.
             * @returns Recovered byte tree and how many bytes were read as a pair.
             */
            static readByteTreeFromByteArray(source, squeeze = false) {
                const bti = ByteTree.readByteTreeFromByteArrayIndex(source, 0, squeeze);
                return bti.byteTree;
            }
            static getSqueezedHeader(source, index) {
                // Node type.
                const nodeType = ((source[index] >>> 7) & 0x01);
                // Number of 4 bit blocks.
                const h = ((source[index] >>> 4) & 0x07) + 1;
                // Read all blocks.
                let length = 0;
                for (let i = 0; i < h; i++) {
                    const odd = i & 0x1;
                    length <<= 4;
                    length |= (source[index] >>> 4 * odd) & 0xF;
                    index += 1 - odd;
                }
                return [nodeType, length, (h + 2) >> 1];
            }
            static getHeader(source, index, squeeze) {
                if (squeeze) {
                    return ByteTree.getSqueezedHeader(source, index);
                } else {
                    // Read type of byte tree.
                    const nodeType = source[index];
                    if (nodeType !== ByteTree.LEAF && nodeType !== ByteTree.NODE) {
                        throw Error("Unknown node type! (" + nodeType + ")");
                    }
                    index++;
                    // Read number of bytes/children.
                    const length = readUint32FromByteArray(source, index);
                    if (length <= 0) {
                        throw Error("Non-positive length! (" + length + ")");
                    }
                    return [nodeType, length, 5];
                }
            }
            static readByteTreeFromByteArrayIndex(source, index, squeeze) {
                const origIndex = index;
                const [nodeType, length, headerLength] = ByteTree.getHeader(source, index, squeeze);
                index += headerLength;
                let byteTree;
                if (nodeType === ByteTree.LEAF) {
                    if (index + length <= source.length) {
                        const data = source.slice(index, index + length);
                        index += length;
                        byteTree = new ByteTree(data);
                    } else {
                        throw Error("Unable to read data for leaf, missing bytes! " +
                            "(index = " + index +
                            ", length = " + length + ")");
                    }
                } else {
                    const children = [];
                    for (let i = 0; i < length; i++) {
                        const bti = ByteTree.readByteTreeFromByteArrayIndex(source, index, squeeze);
                        children.push(bti.byteTree);
                        index += bti.index;
                    }
                    byteTree = new ByteTree(children);
                }
                return new ByteTreeIndex(byteTree, index - origIndex);
            }
            /**
             * Computes a byte tree representation of the absolute value
             * of this integer.
             * @returns Byte tree representation of this integer.
             */
            static LItoByteTree(value) {
                return new ByteTree(value.toByteArray());
            }
            /**
             * Creates a non-negative integer from its representation as a
             * byte tree.
             *
             * @param byteTree - Byte Tree representation of non-negative
             * integer.
             */
            static byteTreeToLI(byteTree) {
                if (byteTree.isLeaf()) {
                    const bytes = byteTree.value;
                    return new LI(bytes);
                } else {
                    throw Error("Expected a leaf!");
                }
            }
            /**
             * Converts an integer to its byte tree representation.
             *
             * @returns Byte tree representation of an integer.
             */
            static intToByteTree(value) {
                const bytes = [0, 0, 0, 0];
                bytes[3] = value & 0xFF;
                value >>= 8;
                bytes[2] = value & 0xFF;
                value >>= 8;
                bytes[1] = value & 0xFF;
                value >>= 8;
                bytes[0] = value & 0xFF;
                return new ByteTree(bytes);
            }
            /**
             * Guarantees that the input is a byte tree.
             *
             * @param value - Byte tree or a byte array.
             * @returns Input value if it is a byte tree and a leaf byte tree based
             * on the byte array otherwise.
             */
            static asByteTree(value) {
                if (ofType(value, ByteTree)) {
                    return value;
                } else {
                    return new ByteTree(value);
                }
            }
        }
        // These are internal constants.
        ByteTree.LEAF = 1;
        ByteTree.NODE = 0;
        algebra.ByteTree = ByteTree;
        /**
         * Ring of prime characteristic.
         */
        class PRing extends VerificatumObject {
            constructor() {
                super();
            }
        }
        algebra.PRing = PRing;
        /**
         * Element of ring of {@link PRing}.
         */
        class PRingElement extends VerificatumObject {
            constructor(pRing) {
                super();
                this.pRing = pRing;
            }
            /**
             * Throws an error if this and the input are not
             * instances of the same class and are contained in the same ring.
             *
             * @param other - Other element expected to be contained in the same
             * ring.
             */
            assertType(other) {
                if (other.getName() !== this.getName()) {
                    throw Error("Element of wrong class! (" +
                        other.getName() + " != " + this.getName() + ")");
                } else if (!this.pRing.equals(other.pRing)) {
                    throw Error("Distinct rings");
                }
            }
            /**
             * Returns the ring containing this element.
             * @returns Ring containing this element.
             */
            getPRing() {
                return this.pRing;
            }
        }
        algebra.PRingElement = PRingElement;
        /**
         * Prime order field.
         */
        class PField extends PRing {
            constructor(order) {
                super();
                if (typeof order === "number") {
                    this.order = new LI(order.toString(16));
                } else if (ofType(order, "string")) {
                    this.order = new LI(order);
                } else {
                    this.order = order;
                }
                this.bitLength = this.order.bitLength();
                this.byteLength = this.order.toByteArray().length;
            }
            getPField() {
                return this;
            }
            equals(other) {
                if (this === other) {
                    return true;
                } else if (other.getName() === "PField") {
                    return this.order.equals(other.order);
                } else {
                    return false;
                }
            }
            getZERO() {
                return new PFieldElement(this, LI.ZERO);
            }
            getONE() {
                return new PFieldElement(this, LI.ONE);
            }
            randomElementByteLength(statDist) {
                return LI.byteLengthRandom(this.bitLength + statDist);
            }
            randomElement(randomSource, statDist) {
                const r = new LI(this.bitLength + statDist, randomSource);
                return new PFieldElement(this, r.mod(this.order));
            }
            toElement(byteTree) {
                if (byteTree.isLeaf() &&
                    byteTree.value.length === this.getByteLength()) {
                    return this.toElementFromByteArray(byteTree.value);
                } else {
                    throw Error("ByteTree is not a leaf!");
                }
            }
            /**
             * Recovers an element from a raw byte array
             * representation of its integer representative.
             *
             * @param bytes - Byte representing an integer representative of a
             * field element.
             * @returns Element represented by the input.
             */
            toElementFromByteArray(bytes) {
                const integer = new LI(bytes);
                return new PFieldElement(this, integer.mod(this.order));
            }
            getByteLength() {
                return this.byteLength;
            }
            getEncodeLength() {
                return Math.floor((this.order.bitLength() - 1) / 8);
            }
            toString() {
                return this.order.toHexString();
            }
        }
        algebra.PField = PField;
        /**
         * Element of {@link PField}.
         */
        class PFieldElement extends PRingElement {
            constructor(pField, value) {
                super(pField);
                this.value = value;
                this.pField = pField;
            }
            equals(other) {
                this.assertType(other);
                const otherPFieldElement = other;
                return this.value.cmp(otherPFieldElement.value) === 0;
            }
            invertible() {
                return !this.equals(this.pField.getZERO());
            }
            neg() {
                return new PFieldElement(this.pField, this.pField.order.sub(this.value));
            }
            mul(other) {
                let v;
                if (ofClass(other, PFieldElement)) {
                    const otherPFieldElement = other;
                    v = this.value.modMul(otherPFieldElement.value, this.pField.order);
                } else {
                    const otherLI = other;
                    v = this.value.modMul(otherLI, this.pField.order);
                }
                return new PFieldElement(this.pField, v);
            }
            add(other) {
                this.assertType(other);
                const v = this.value.modAdd(other.value, this.pField.order);
                return new PFieldElement(this.pField, v);
            }
            sub(other) {
                this.assertType(other);
                const v = this.value.modSub(other.value, this.pField.order);
                return new PFieldElement(this.pField, v);
            }
            inv() {
                const v = this.value.modInv(this.pField.order);
                return new PFieldElement(this.pField, v);
            }
            toByteTree() {
                const byteLength = this.pField.byteLength;
                return new ByteTree(this.value.toByteArray(byteLength));
            }
            toString() {
                return this.value.toHexString();
            }
        }
        algebra.PFieldElement = PFieldElement;
        // This code would become more complex using map, some, etc without
        // any gain in speed.
        /**
         * Product ring over prime order fields.
         */
        class PPRing extends VerificatumObject {
            constructor(representation) {
                super();
                if (representation.length === 2 &&
                    typeof representation[1] == "number") {
                    const pRing = representation[0];
                    const width = representation[1];
                    this.pRings = fill(pRing, width);
                } else {
                    this.pRings = representation;
                }
                const zeros = [];
                for (let i = 0; i < this.pRings.length; i++) {
                    zeros[i] = this.pRings[i].getZERO();
                }
                this.ZERO = new PPRingElement(this, zeros);
                const ones = [];
                for (let i = 0; i < this.pRings.length; i++) {
                    ones[i] = this.pRings[i].getONE();
                }
                this.ONE = new PPRingElement(this, ones);
                this.byteLength = this.ONE.toByteTree().toByteArray().length;
            }
            getPField() {
                return this.pRings[0].getPField();
            }
            equals(other) {
                if (this === other) {
                    return true;
                } else if (other.getName() === "PPRing") {
                    const pPRingOther = other;
                    if (this.pRings.length === pPRingOther.pRings.length) {
                        for (let i = 0; i < this.pRings.length; i++) {
                            if (!this.pRings[i].equals(pPRingOther.pRings[i])) {
                                return false;
                            }
                        }
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
            getZERO() {
                return this.ZERO;
            }
            getONE() {
                return this.ONE;
            }
            randomElementByteLength(statDist) {
                let byteLength = 0;
                for (let i = 0; i < this.pRings.length; i++) {
                    byteLength += this.pRings[i].randomElementByteLength(statDist);
                }
                return byteLength;
            }
            randomElement(randomSource, statDist) {
                const values = [];
                for (let i = 0; i < this.pRings.length; i++) {
                    values[i] = this.pRings[i].randomElement(randomSource, statDist);
                }
                return new PPRingElement(this, values);
            }
            toElement(byteTree) {
                if (!byteTree.isLeaf() ||
                    byteTree.value.length === this.pRings.length) {
                    const byteTrees = byteTree.value;
                    const children = [];
                    for (let i = 0; i < this.pRings.length; i++) {
                        children[i] = this.pRings[i].toElement(byteTrees[i]);
                    }
                    return new PPRingElement(this, children);
                } else {
                    throw Error("Input byte tree does not represent an element!");
                }
            }
            getByteLength() {
                return this.byteLength;
            }
            getEncodeLength() {
                return Math.floor((this.getPField().order.bitLength() + 1) / 8);
            }
            toString() {
                let s = "";
                for (let i = 0; i < this.pRings.length; i++) {
                    s += "," + this.pRings[i].toString();
                }
                return "(" + s.slice(1) + ")";
            }
            /**
             * Product width of this ring.
             * @returns Product width of this ring.
             */
            getWidth() {
                return this.pRings.length;
            }
            /**
             * ith component of this product ring.
             * @returns ith component of this product ring.
             */
            project(i) {
                return this.pRings[i];
            }
            prod(value) {
                let i;
                let elements;
                // We proceed optimistically and verify the result below.
                // List of elements.
                if (ofType(value, "array")) {
                    elements = value;
                    if (elements.length !== this.pRings.length) {
                        throw Error("Wrong number of elements! (" +
                            elements.length +
                            " != " + this.pRings.length + ")");
                    }
                    // Repeated element.
                } else {
                    const element = value;
                    elements = [];
                    for (i = 0; i < this.pRings.length; i++) {
                        elements[i] = element;
                    }
                }
                // Verify that the result belongs to this ring.
                for (i = 0; i < this.pRings.length; i++) {
                    if (!elements[i].pRing.equals(this.pRings[i])) {
                        throw Error("Element " + i + " belongs to the wrong subring!");
                    }
                }
                return new PPRingElement(this, elements);
            }
        }
        algebra.PPRing = PPRing;
        // This code would become more complex using map, some, etc without
        // any gain in speed.
        /**
         * Element of product ring over prime order fields.
         */
        class PPRingElement extends PRingElement {
            constructor(pPRing, values) {
                super(pPRing);
                this.values = values;
            }
            equals(other) {
                this.assertType(other);
                const values = other.values;
                for (let i = 0; i < this.values.length; i++) {
                    if (!this.values[i].equals(values[i])) {
                        return false;
                    }
                }
                return true;
            }
            add(other) {
                this.assertType(other);
                const values = other.values;
                const resValues = [];
                for (let i = 0; i < this.values.length; i++) {
                    resValues[i] = this.values[i].add(values[i]);
                }
                return new PPRingElement(this.pRing, resValues);
            }
            sub(other) {
                this.assertType(other);
                const values = other.values;
                const resValues = [];
                for (let i = 0; i < this.values.length; i++) {
                    resValues[i] = this.values[i].sub(values[i]);
                }
                return new PPRingElement(this.pRing, resValues);
            }
            neg() {
                const resValues = [];
                for (let i = 0; i < this.values.length; i++) {
                    resValues[i] = this.values[i].neg();
                }
                return new PPRingElement(this.pRing, resValues);
            }
            mul(other) {
                const resValues = [];
                if (ofClass(other, PPRingElement) &&
                    this.pRing.equals(other.pRing)) {
                    const values = other.values;
                    for (let i = 0; i < this.values.length; i++) {
                        resValues[i] = this.values[i].mul(values[i]);
                    }
                } else {
                    for (let i = 0; i < this.values.length; i++) {
                        resValues[i] = this.values[i].mul(other);
                    }
                }
                return new PPRingElement(this.pRing, resValues);
            }
            invertible() {
                for (let i = 0; i < this.values.length; i++) {
                    if (!this.values[i].invertible()) {
                        return false;
                    }
                }
                return true;
            }
            inv() {
                const resValues = [];
                for (let i = 0; i < this.values.length; i++) {
                    resValues[i] = this.values[i].inv();
                }
                return new PPRingElement(this.pRing, resValues);
            }
            toByteTree() {
                const children = [];
                for (let i = 0; i < this.values.length; i++) {
                    children[i] = this.values[i].toByteTree();
                }
                return new ByteTree(children);
            }
            toString() {
                let s = "";
                for (let i = 0; i < this.values.length; i++) {
                    s += "," + this.values[i].toString();
                }
                return "(" + s.slice(1) + ")";
            }
            /**
             * ith component of this product ring element.
             *
             * @param i - Index of component.
             * @returns ith component of this product ring element.
             */
            project(i) {
                if (i < 0 || this.values.length <= i) {
                    throw Error("Projecting to non-existing index! (i = " +
                        +i + ")");
                } else {
                    return this.values[i];
                }
            }
        }
        algebra.PPRingElement = PPRingElement;
        /**
         * Abstract group where every non-trivial element has the
         * order determined by the input PRing. We stress that this is not
         * necessarily a prime order group. Each group has an associated ring
         * of exponents, i.e., an instance of {@link PRing}.
         */
        class PGroup extends VerificatumObject {
            constructor(pRing) {
                super();
                this.pRing = pRing;
                this.encodeLength = 0;
            }
            /**
             * Returns a byte tree representation of this group including the
             * classname.
             *
             * @returns Byte tree representation of this group.
             */
            marshal() {
                const nbt = new ByteTree(asciiToByteArray(this.getName()));
                return new ByteTree([nbt, this.toByteTree()]);
            }
            /**
             * Determines the number of bytes that can be encoded
             * into a group element.
             * @returns Number of bytes that can be encoded into a group element.
             */
            getEncodeLength() {
                return this.encodeLength;
            }
            /**
             * Encodes the input bytes as a group element.
             *
             * @returns Element constructed from the input byte array.
             */
            encoded(bytes) {
                return this.encode(bytes, 0, bytes.length);
            }
        }
        algebra.PGroup = PGroup;
        /**
         * Abstract group representing an element of {@link PGroup}.
         *
         * @param pGroup - Group to which this element belongs.
         */
        class PGroupElement extends VerificatumObject {
            constructor(pGroup) {
                super();
                this.pGroup = pGroup;
            }
            /**
             * Throws an error if this and the input are not
             * instances of the same class and are contained in the same group.
             *
             * @param other - Other element expected to be contained in the same
             * group.
             */
            assertType(other) {
                if (other.getName() !== this.getName()) {
                    throw Error("Element of wrong class! (" +
                        other.getName() + " != " + this.getName() + ")");
                } else if (!this.pGroup.equals(other.pGroup)) {
                    throw Error("Distinct groupss");
                }
            }
            /**
             * Decodes the contents of a group element and returns the result
             * as an array of bytes.
             */
            decoded() {
                const destination = [];
                const length = this.decode(destination, 0);
                destination.length = length;
                return destination;
            }
        }
        algebra.PGroupElement = PGroupElement;
        // This code becomes more complex using map, some, etc without any
        // gain in speed.
        // Generates the product ring of the product group formed of the list
        // of groups.
        // For some reason this overloading fails.
        // function genPRing(pGroups: PGroup[]): PRing;
        // function genPRing(groupAndWidth: [PGroup, size_t]): PRing;
        function genPRing(representation) {
            if (representation.length === 2 &&
                typeof representation[1] == "number") {
                const pGroup = representation[0];
                const width = representation[1];
                return new PPRing([pGroup.pRing, width]);
            } else {
                const pGroups = representation;
                const pRings = [];
                for (let i = 0; i < pGroups.length; i++) {
                    pRings[i] = pGroups[i].pRing;
                }
                return new PPRing(pRings);
            }
        }
        /**
         * Product group of groups where all non-trivial elements
         * have identical odd prime orders.
         */
        class PPGroup extends PGroup {
            constructor(representation) {
                super(genPRing(representation));
                if (representation.length === 2 &&
                    typeof representation[1] == "number") {
                    const pGroup = representation[0];
                    const width = representation[1];
                    this.pGroups = fill(pGroup, width);
                } else {
                    this.pGroups = representation;
                }
                this.encodeLength = 0;
                for (let i = 0; i < this.pGroups.length; i++) {
                    this.encodeLength += this.pGroups[i].encodeLength;
                }
                const gs = [];
                for (let i = 0; i < this.pGroups.length; i++) {
                    gs[i] = this.pGroups[i].getg();
                }
                this.generator = new PPGroupElement(this, gs);
                const ones = [];
                for (let i = 0; i < this.pGroups.length; i++) {
                    ones[i] = this.pGroups[i].getONE();
                }
                this.ONE = new PPGroupElement(this, ones);
                this.byteLength = this.ONE.toByteTree().toByteArray().length;
            }
            getPrimeOrderPGroup() {
                return this.pGroups[0].getPrimeOrderPGroup();
            }
            equals(other) {
                if (this === other) {
                    return true;
                } else if (other.getName() === "PPGroup") {
                    const otherPPGroup = other;
                    if (this.pGroups.length === otherPPGroup.pGroups.length) {
                        for (let i = 0; i < this.pGroups.length; i++) {
                            if (!this.pGroups[i].equals(otherPPGroup.pGroups[i])) {
                                return false;
                            }
                        }
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
            /**
             * Returns the width, i.e., the number of groups from
             * which this product group is formed.
             * @returns Width of product.
             */
            getWidth() {
                return this.pGroups.length;
            }
            /**
             * Returns ith factor of this product group.
             *
             * @param i - Index of factor to return.
             * @returns Factor of this product group.
             */
            project(i) {
                return this.pGroups[i];
            }
            /**
             * Returns an element of this group formed from elements
             * of its factor groups.
             *
             * @param value - Array of elements from the factor groups of this
             * product group, or a single element, in which case it is assumed
             * that this group is a power of a single group.
             * @returns Element of this group.
             * @returns Factor of this product group.
             */
            prod(value) {
                let elements;
                // List of elements.
                if (ofType(value, "array")) {
                    elements = value;
                    if (elements.length !== this.pGroups.length) {
                        throw Error("Wrong number of elements! (" +
                            elements.length + " != " +
                            this.pGroups.length + ")");
                    }
                    // Repeated element.
                } else {
                    elements = [];
                    for (let i = 0; i < this.pGroups.length; i++) {
                        elements[i] = value;
                    }
                }
                // Verify that the elements belong to the right groups.
                for (let i = 0; i < this.pGroups.length; i++) {
                    if (!elements[i].pGroup.equals(this.pGroups[i])) {
                        throw Error("Element " + i + " belongs to the wrong group!");
                    }
                }
                return new PPGroupElement(this, elements);
            }
            getElementOrder() {
                return this.pGroups[0].getElementOrder();
            }
            getg() {
                return this.generator;
            }
            getONE() {
                return this.ONE;
            }
            randomElement(randomSource, statDist) {
                const elements = [];
                for (let i = 0; i < this.pGroups.length; i++) {
                    elements[i] = this.pGroups[i].randomElement(randomSource, statDist);
                }
                return new PPGroupElement(this, elements);
            }
            toElement(byteTree) {
                if (!byteTree.isLeaf() ||
                    byteTree.value.length === this.pGroups.length) {
                    const children = [];
                    for (let i = 0; i < this.pGroups.length; i++) {
                        children[i] =
                            this.pGroups[i].toElement(byteTree.value[i]);
                    }
                    return new PPGroupElement(this, children);
                } else {
                    throw Error("Input byte tree does not represent an element!");
                }
            }
            getByteLength() {
                return this.byteLength;
            }
            toString() {
                let s = "";
                for (let i = 0; i < this.pGroups.length; i++) {
                    s += "," + this.pGroups[i].toString();
                }
                return "(" + s.slice(1) + ")";
            }
            encode(bytes, startIndex, length) {
                const elements = [];
                for (let i = 0; i < this.pGroups.length; i++) {
                    const len = Math.min(length, this.pGroups[i].encodeLength);
                    elements[i] = this.pGroups[i].encode(bytes, startIndex, len);
                    startIndex += len;
                    length -= len;
                }
                return new PPGroupElement(this, elements);
            }
            /**
             * Computes a list of underlying basic groups.
             *
             * @param pGroup - Group to investigate.
             * @param grps - List storing the found underlying groups.
             */
            static findBasicPGroups(pGroup, grps) {
                if (pGroup.getName() == "PPGroup") {
                    const basicPGroups = pGroup.pGroups;
                    for (let i = 0; i < basicPGroups.length; i++) {
                        PPGroup.findBasicPGroups(basicPGroups[i], grps);
                    }
                } else if (grps.findIndex((pg) => pGroup.equals(pg)) < 0) {
                    grps.push(pGroup);
                }
            }
            /**
             * Computes a representation of the structure of this group.
             *
             * @param pGroup - Group to investigate.
             * @param grps - List storing the found underlying groups.
             * @returns Representation of the structure of this instance.
             */
            static toByteTreeStructure(pGroup, grps) {
                if (pGroup.getName() === "PPGroup") {
                    const pgs = pGroup.pGroups;
                    const btbs = [];
                    for (let i = 0; i < pgs.length; i++) {
                        btbs[i] = PPGroup.toByteTreeStructure(pgs[i], grps);
                    }
                    return new ByteTree(btbs);
                } else {
                    const grpIndex = grps.findIndex((pg) => pGroup.equals(pg));
                    return ByteTree.intToByteTree(grpIndex);
                }
            }
            toByteTree() {
                // Find basic groups.
                const grps = [];
                PPGroup.findBasicPGroups(this, grps);
                // Pack the basic groups.
                const bbts = [];
                for (let i = 0; i < grps.length; i++) {
                    bbts[i] = grps[i].marshal();
                }
                const bbt = new ByteTree(bbts);
                // Compute group structure.
                const bts = PPGroup.toByteTreeStructure(this, grps);
                return new ByteTree([bbt, bts]);
            }
            /**
             * Returns a product group or the input group if the
             * given width equals one.
             *
             * @param pGroup - Basic group.
             * @param keyWidth - Width of product group.
             * @returns Input group or product group.
             */
            static getWideGroup(pGroup, keyWidth) {
                if (keyWidth > 1) {
                    return new PPGroup([pGroup, keyWidth]);
                } else {
                    return pGroup;
                }
            }
            /**
             * Recovers a PPGroup instance from its representation
             * as a byte tree.
             *
             * @param byteTree - Byte tree representation of a PPGroup instance.
             * @returns Instance of PPGroup.
             */
            static fromByteTree(byteTree) {
                if (byteTree.isLeaf() || byteTree.value.length !== 2) {
                    throw Error("Invalid representation of a group!");
                }
                const byteTrees = byteTree.value;
                const atomicPGroups = PPGroup.atomicPGroups(byteTrees[0]);
                return PPGroup.fromStructure(byteTrees[1], atomicPGroups);
            }
            // Recovers atomic PGroups.
            static atomicPGroups(byteTree) {
                if (byteTree.isLeaf() || byteTree.value.length === 0) {
                    throw Error("Invalid representation of atomic groups!");
                }
                const pGroups = [];
                for (let i = 0; i < byteTree.value.length; i++) {
                    pGroups[i] =
                        PGroupFactory.unmarshalPGroup(byteTree.value[i]);
                }
                return pGroups;
            }
            // Recovers PGroup from a structure and an array of atomic groups.
            static fromStructure(byteTree, atomicPGroups) {
                if (byteTree.isLeaf()) {
                    if (byteTree.value.length !== 4) {
                        throw Error("Leaf does not contain an index!");
                    }
                    const bytes = byteTree.value;
                    const index = readUint32FromByteArray(bytes);
                    if (index >= 0 && index < atomicPGroups.length) {
                        return atomicPGroups[index];
                    } else {
                        throw Error("Index out of range!");
                    }
                } else {
                    const pGroups = [];
                    const byteTrees = byteTree.value;
                    for (let i = 0; i < byteTrees.length; i++) {
                        pGroups[i] = PPGroup.fromStructure(byteTrees[i], atomicPGroups);
                    }
                    return new PPGroup(pGroups);
                }
            }
        }
        algebra.PPGroup = PPGroup;
        // This code becomes more complex using map, some, etc without any
        // gain in speed.
        /**
         * Element of {@link PPGroup}.
         */
        class PPGroupElement extends PGroupElement {
            constructor(pPGroup, values) {
                super(pPGroup);
                this.values = values;
            }
            equals(other) {
                this.assertType(other);
                const values = other.values;
                for (let i = 0; i < this.values.length; i++) {
                    if (!this.values[i].equals(values[i])) {
                        return false;
                    }
                }
                return true;
            }
            mul(other) {
                this.assertType(other);
                const values = [];
                const otherValues = other.values;
                for (let i = 0; i < this.values.length; i++) {
                    values[i] = this.values[i].mul(otherValues[i]);
                }
                return new PPGroupElement(this.pGroup, values);
            }
            /* eslint-disable @typescript-eslint/no-unused-vars */
            fixed(exponentiations) {
                // We do not precompute for product group elements.
            }
            exp(exponent) {
                let i;
                const values = [];
                if (exponent.getName() === "PPRingElement" &&
                    exponent.pRing.equals(this.pGroup.pRing)) {
                    const exponents = exponent.values;
                    for (i = 0; i < this.values.length; i++) {
                        values[i] = this.values[i].exp(exponents[i]);
                    }
                } else {
                    for (i = 0; i < this.values.length; i++) {
                        values[i] = this.values[i].exp(exponent);
                    }
                }
                return new PPGroupElement(this.pGroup, values);
            }
            inv() {
                const values = [];
                for (let i = 0; i < this.values.length; i++) {
                    values[i] = this.values[i].inv();
                }
                return new PPGroupElement(this.pGroup, values);
            }
            toByteTree() {
                const children = [];
                for (let i = 0; i < this.values.length; i++) {
                    children[i] = this.values[i].toByteTree();
                }
                return new ByteTree(children);
            }
            toString() {
                let s = "";
                for (let i = 0; i < this.values.length; i++) {
                    s += "," + this.values[i].toString();
                }
                return "(" + s.slice(1) + ")";
            }
            /**
             * ith component of this product group element.
             *
             * @param i - Index of component.
             * @returns ith component of this product group element.
             */
            project(i) {
                return this.values[i];
            }
            decode(destination, startIndex) {
                const origStartIndex = startIndex;
                for (let i = 0; i < this.values.length; i++) {
                    startIndex += this.values[i].decode(destination, startIndex);
                }
                return startIndex - origStartIndex;
            }
        }
        algebra.PPGroupElement = PPGroupElement;
        /**
         * Multiplicative group modulo a prime.
         */
        class ModPGroup extends PGroup {
            /**
             * Instantiates a group with the given parameters. We leave this
             * constructor unprotected to allow developers to
             * experiment. Please do not instantiate any group using this
             * constructor in real-world applications. Use {@link
             * ModPGroup.getPGroup} instead and use one of the named standard
             * groups.
             *
             * @param modulus - Modulus of complete multiplicative group.
             * @param order - Order of subgroup of the multiplicative group.
             * @param gi - Integer representative of standard generator.
             * @param encoding - Encoding scheme used to embed arbitrary
             * strings as group elements.
             */
            constructor(modulus, order, gi, encoding, alg = ModPowAlg.window) {
                super(new PField(order));
                this.modulus = modulus;
                this.generator = new ModPGroupElement(this, gi);
                this.encoding = encoding;
                this.alg = alg;
                this.modulusByteLength = this.modulus.toByteArray().length;
                this.ONE = new ModPGroupElement(this, LI.ONE);
                // Order of the multiplicative group modulo this group.
                this.coOrder = modulus.sub(LI.ONE).div(order);
                // RO encoding.
                if (this.encoding === 0) {
                    throw Error("RO encoding is not supported!");
                    // Safe prime encoding.
                } else if (this.encoding === 1) {
                    this.encodeLength =
                        Math.floor((this.modulus.bitLength() - 2) / 8) - 4;
                    // Subgroup encoding.
                } else if (this.encoding === 2) {
                    throw Error("Subgroup encoding is not supported!");
                } else {
                    throw Error("Unsupported encoding! (" + this.encoding + ")");
                }
            }
            getPrimeOrderPGroup() {
                return this;
            }
            equals(other) {
                if (this === other) {
                    return true;
                } else if (other.getName() === "ModPGroup") {
                    const otherModPGroup = other;
                    return this.modulus.equals(otherModPGroup.modulus) &&
                        this.generator.value.equals(otherModPGroup.generator.value) &&
                        this.encoding === otherModPGroup.encoding;
                } else {
                    return false;
                }
            }
            getElementOrder() {
                return this.pRing.order;
            }
            getg() {
                return this.generator;
            }
            getONE() {
                return this.ONE;
            }
            toElement(byteTree) {
                if (byteTree.isLeaf()) {
                    if (byteTree.value.length == this.modulusByteLength) {
                        const bytes = byteTree.value;
                        // An element in a multiplicative group is always
                        // non-zero.
                        const value = new LI(bytes);
                        if (value.cmp(this.modulus) <= 0) {
                            return new ModPGroupElement(this, value);
                        } else {
                            throw Error("Integer representative not canonically " +
                                "reduced!");
                        }
                    } else {
                        throw Error("Wrong number of bytes! (" +
                            byteTree.value.length + " != " +
                            this.modulusByteLength + ")");
                    }
                } else {
                    throw Error("Byte tree is not a leaf!");
                }
            }
            encode(bytes, startIndex, length) {
                const elen = this.encodeLength;
                if (length > elen) {
                    throw Error("Input is too long! (" + length + " > " + elen + ")");
                }
                // Make room for a leading integer and data.
                const bytesToUse = [];
                bytesToUse.length = elen + 4;
                // Write length of data.
                setUint32ToByteArray(bytesToUse, length, 0);
                // Write data.
                let i = startIndex;
                let j = 4;
                while (j < length + 4) {
                    bytesToUse[j] = bytes[i];
                    i++;
                    j++;
                }
                // Zero out the rest.
                while (j < bytesToUse.length) {
                    bytesToUse[j] = 0;
                    j++;
                }
                // Make sure value is non-zero. (Ignored during decoding due to
                // zero length.)
                if (length === 0) {
                    bytesToUse[5] = 1;
                }
                // Negate if not a quadratic residue.
                let value = new LI(bytesToUse);
                if (value.legendre(this.modulus) !== 1) {
                    value = this.modulus.sub(value);
                }
                return new ModPGroupElement(this, value);
            }
            randomElement(randomSource, statDist) {
                const bits = 8 * this.modulusByteLength + statDist;
                let r = new LI(bits, randomSource);
                r = r.mod(this.modulus).modPow(this.coOrder, this.modulus);
                return new ModPGroupElement(this, r);
            }
            toString() {
                return this.modulus.toHexString() + ":" +
                    this.getElementOrder().toHexString() + ":" +
                    this.generator.toString() + ":encoding(" + this.encoding + ")";
            }
            toByteTree() {
                return new ByteTree([ByteTree.LItoByteTree(this.modulus),
                    ByteTree.LItoByteTree(this.getElementOrder()),
                    ByteTree.LItoByteTree(this.generator.value),
                    ByteTree.intToByteTree(this.encoding)
                ]);
            }
            /**
             * Recovers a ModPGroup instance from its representation
             * as a byte tree.
             *
             * @param byteTree - Byte tree representation of a ModPGroup instance.
             * @returns Instance of ModPGroup.
             */
            static fromByteTree(byteTree) {
                if (byteTree.isLeaf()) {
                    throw Error("Byte tree is a leaf, expected four children!");
                } else if (byteTree.value.length !== 4) {
                    throw Error("Wrong number of children! (" +
                        byteTree.value.length + " !== 4)");
                }
                const byteTrees = byteTree.value;
                const modulus = ByteTree.byteTreeToLI(byteTrees[0]);
                const order = ByteTree.byteTreeToLI(byteTrees[1]);
                const gi = ByteTree.byteTreeToLI(byteTrees[2]);
                byteTree = byteTrees[3];
                if (byteTree.isLeaf()) {
                    const encoding = readUint32FromByteArray(byteTree.value);
                    if (encoding >= 4) {
                        throw Error("Unsupported encoding number!");
                    }
                    return new ModPGroup(modulus, order, gi, encoding);
                } else {
                    throw Error("Malformed encoding number!");
                }
            }
            /**
             * Returns true or false depending on if a standardized group is
             * registered with the given name.
             *
             * @param groupName - Name of standardized group.
             * @returns True if the group is registered and false otherwise.
             */
            static hasPGroup(groupName) {
                return algebra.ModPGroup_named.has(groupName);
            }
            /**
             * Returns the parameters of the given named group.
             * @returns Parameters of the named group.
             */
            static getParams(groupName) {
                if (algebra.ModPGroup_named.has(groupName)) {
                    return algebra.ModPGroup_named.get(groupName);
                } else {
                    throw Error("Unknown group name! (" + groupName + ")");
                }
            }
            /**
             * Returns the group with the given name.
             * @returns Named group.
             */
            static getPGroup(groupName) {
                const params = ModPGroup.getParams(groupName);
                const modulus = new LI(params[0]);
                const gi = new LI(params[1]);
                const order = modulus.sub(LI.ONE).div(LI.TWO);
                const encoding = 1;
                return new ModPGroup(modulus, order, gi, encoding);
            }
            /**
             * Returns an array of all names of available
             * multiplicative groups.
             * @returns Array of all names of available multiplicative groups.
             */
            static getPGroupNames() {
                const groupNames = [];
                let i = 0;
                for (const key of algebra.ModPGroup_named.keys()) {
                    groupNames[i++] = key;
                }
                return groupNames;
            }
            /**
             * Returns an array of all available multiplicative groups.
             * @returns Array of all available multiplicative groups.
             */
            static getPGroups() {
                const pGroupNames = ModPGroup.getPGroupNames();
                const pGroups = [];
                for (let i = 0; i < pGroupNames.length; i++) {
                    pGroups[i] = ModPGroup.getPGroup(pGroupNames[i]);
                }
                return pGroups;
            }
        }
        algebra.ModPGroup = ModPGroup;
        /**
         * Element of {@link ModPGroup}.
         */
        class ModPGroupElement extends PGroupElement {
            constructor(pGroup, value) {
                super(pGroup);
                this.value = value;
                this.fixExp = null;
            }
            equals(other) {
                this.assertType(other);
                return this.value.equals(other.value);
            }
            mul(factor) {
                this.assertType(factor);
                const value = this.value.mul(factor.value).
                mod(this.pGroup.modulus);
                return new ModPGroupElement(this.pGroup, value);
            }
            fixed(exponentiations) {
                this.fixExp =
                    new FixModPow(this.value, this.pGroup.modulus, exponentiations);
            }
            exp(exponent, alg) {
                let lIE;
                if (exponent.getName() === "PFieldElement") {
                    lIE = exponent.value;
                } else {
                    lIE = exponent;
                }
                const mpg = this.pGroup;
                if (typeof alg === "undefined") {
                    alg = mpg.alg;
                }
                if (this.fixExp === null) {
                    const value = this.value.modPow(lIE, mpg.modulus, alg);
                    return new ModPGroupElement(mpg, value);
                } else {
                    return new ModPGroupElement(mpg, this.fixExp.modPow(lIE));
                }
            }
            inv() {
                if (this.value.iszero()) {
                    throw Error("Attempting to invert zero!");
                } else {
                    const invValue = this.value.modInv(this.pGroup.modulus);
                    return new ModPGroupElement(this.pGroup, invValue);
                }
            }
            decode(destination, startIndex) {
                let i;
                let j;
                let val = this.pGroup.modulus.sub(this.value);
                if (this.value.cmp(val) < 0) {
                    val = this.value;
                }
                let bytes = val.toByteArray();
                // Slice spurious bytes if any.
                const ulen = this.pGroup.encodeLength + 4;
                if (bytes.length > ulen) {
                    bytes = bytes.slice(bytes.length - ulen);
                }
                // Add leading zero bytes if needed.
                if (bytes.length < ulen) {
                    const raw = [];
                    i = 0;
                    while (i < ulen - bytes.length) {
                        raw[i] = 0;
                        i++;
                    }
                    j = 0;
                    while (j < bytes.length) {
                        raw[i] = bytes[j];
                        i++;
                        j++;
                    }
                    bytes = raw;
                }
                // Now we have exactly this.pGroup.encodeLength bytes.
                const len = readUint32FromByteArray(bytes, 0);
                if (len < 0 || this.pGroup.encodeLength < len) {
                    throw Error("Illegal length of data! (" + len + ")");
                }
                i = startIndex;
                j = 4;
                while (j < len + 4) {
                    destination[i] = bytes[j];
                    i++;
                    j++;
                }
                return len;
            }
            toByteTree() {
                const mbl = this.pGroup.modulusByteLength;
                const byteArray = this.value.toByteArray(mbl);
                return new ByteTree(byteArray);
            }
            toString() {
                return this.value.toHexString();
            }
        }
        algebra.ModPGroupElement = ModPGroupElement;
        algebra.ModPGroup_named = new Map();
        algebra.ModPGroup_named.set("modp768", ["FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A63A3620FFFFFFFFFFFFFFFF",
            "02"
        ]);
        algebra.ModPGroup_named.set("modp1024", ["FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE65381FFFFFFFFFFFFFFFF",
            "02"
        ]);
        algebra.ModPGroup_named.set("modp1536", ["FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA237327FFFFFFFFFFFFFFFF",
            "02"
        ]);
        algebra.ModPGroup_named.set("modp2048", ["FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFFFFFFFFFF",
            "02"
        ]);
        algebra.ModPGroup_named.set("modp3072", ["FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF",
            "02"
        ]);
        algebra.ModPGroup_named.set("modp4096", ["FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C934063199FFFFFFFFFFFFFFFF",
            "02"
        ]);
        algebra.ModPGroup_named.set("modp6144", ["FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C93402849236C3FAB4D27C7026C1D4DCB2602646DEC9751E763DBA37BDF8FF9406AD9E530EE5DB382F413001AEB06A53ED9027D831179727B0865A8918DA3EDBEBCF9B14ED44CE6CBACED4BB1BDB7F1447E6CC254B332051512BD7AF426FB8F401378CD2BF5983CA01C64B92ECF032EA15D1721D03F482D7CE6E74FEF6D55E702F46980C82B5A84031900B1C9E59E7C97FBEC7E8F323A97A7E36CC88BE0F1D45B7FF585AC54BD407B22B4154AACC8F6D7EBF48E1D814CC5ED20F8037E0A79715EEF29BE32806A1D58BB7C5DA76F550AA3D8A1FBFF0EB19CCB1A313D55CDA56C9EC2EF29632387FE8D76E3C0468043E8F663F4860EE12BF2D5B0B7474D6E694F91E6DCC4024FFFFFFFFFFFFFFFF",
            "02"
        ]);
        algebra.ModPGroup_named.set("modp8192", ["FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C93402849236C3FAB4D27C7026C1D4DCB2602646DEC9751E763DBA37BDF8FF9406AD9E530EE5DB382F413001AEB06A53ED9027D831179727B0865A8918DA3EDBEBCF9B14ED44CE6CBACED4BB1BDB7F1447E6CC254B332051512BD7AF426FB8F401378CD2BF5983CA01C64B92ECF032EA15D1721D03F482D7CE6E74FEF6D55E702F46980C82B5A84031900B1C9E59E7C97FBEC7E8F323A97A7E36CC88BE0F1D45B7FF585AC54BD407B22B4154AACC8F6D7EBF48E1D814CC5ED20F8037E0A79715EEF29BE32806A1D58BB7C5DA76F550AA3D8A1FBFF0EB19CCB1A313D55CDA56C9EC2EF29632387FE8D76E3C0468043E8F663F4860EE12BF2D5B0B7474D6E694F91E6DBE115974A3926F12FEE5E438777CB6A932DF8CD8BEC4D073B931BA3BC832B68D9DD300741FA7BF8AFC47ED2576F6936BA424663AAB639C5AE4F5683423B4742BF1C978238F16CBE39D652DE3FDB8BEFC848AD922222E04A4037C0713EB57A81A23F0C73473FC646CEA306B4BCBC8862F8385DDFA9D4B7FA2C087E879683303ED5BDD3A062B3CF5B3A278A66D2A13F83F44F82DDF310EE074AB6A364597E899A0255DC164F31CC50846851DF9AB48195DED7EA1B1D510BD7EE74D73FAF36BC31ECFA268359046F4EB879F924009438B481C6CD7889A002ED5EE382BC9190DA6FC026E479558E4475677E9AA9E3050E2765694DFC81F56E880B96E7160C980DD98EDD3DFFFFFFFFFFFFFFFFF",
            "02"
        ]);
        /**
         * Elliptic curve group over prime order fields.
         *
         * <p>
         *
         * ASSUMES: 0 <= a, b, gx, gy < modulus, n > 0 and that x^3 + b * x +
         * a (mod modulus) is a non-singular curve of order n.
         *
         * @param modulus - Modulus for underlying field, or the name of a
         * standard curve, in which case the remaining parameters must be
         * empty.
         * @param a - First coefficient for curve of Weierstrass normal form.
         * @param b - Second coefficientfor curve of Weierstrass normal form.
         * @param gx - x-coefficient of standard generator.
         * @param gy - y-coefficient of standard generator.
         * @param n - Order of elliptic curve.
         */
        class ECqPGroup extends PGroup {
            /**
             * Instantiates a group with the given parameters. We leave this
             * constructor unprotected to allow developers to
             * experiment. Please do not instantiate any group using this
             * constructor in real-world applications. Use {@link
             * ECqPgroup.getPGroup} instead and use one of the named standard
             * groups.
             *
             * @param groupName - Name of group.
             * @param modulus - Modulus of underlying prime order field.
             * @param a - Coefficient of f-polynomial of elliptic curve.
             * @param b - Coefficient of f-polynomial of elliptic curve.
             * @param gx - First coordinate of the standard generator of the
             * group.
             * @param gy - Second coordinate of the standard generator of the
             * group.
             * @param n - Order of group.
             */
            constructor(groupName, modulus, a, b, gx, gy, n) {
                super(new PField(n));
                this.groupName = groupName;
                this.curve = new EC(modulus, a, b);
                this.cp = modulus;
                this.ca = a;
                this.cb = b;
                this.generator = new ECqPGroupElement(this, this.toECP(gx, gy));
                this.ONE = new ECqPGroupElement(this, this.toECP(LI.ZERO, LI.ONE, LI.ZERO));
                this.modulusByteLength = modulus.toByteArray().length;
                // Strip most significant bit and keep two bytes for size and one
                // for padding.
                this.encodeLength = Math.floor((modulus.bitLength() - 1) / 8) - 3;
            }
            equals(other) {
                if (this === other) {
                    return true;
                } else if (other.getName() === "ECqPGroup") {
                    const oecpg = other;
                    return this.cp.equals(oecpg.cp) &&
                        this.ca.equals(oecpg.ca) &&
                        this.cb.equals(oecpg.cb) &&
                        this.curve.equals(this.generator.value, oecpg.generator.value);
                    // this.getg().equals(oecpg.getg());
                } else {
                    return false;
                }
            }
            getPrimeOrderPGroup() {
                return this;
            }
            /**
             * Evaluates f(x) = x^3 + a * x + b.
             *
             * @param x - x-coordinate of point on the curve.
             * @returns Value of f at x.
             */
            f(x) {
                const x3 = x.mul(x).mod(this.cp).mul(x).mod(this.cp);
                const ax = this.ca.mul(x).mod(this.cp);
                return x3.add(ax).add(this.cb).mod(this.cp);
            }
            /**
             * Checks if an affine point (x, y) is a point on the
             * curve.
             *
             * @param x - x-coordinate of prospective point.
             * @param y - y-coordinate of prospective point.
             * @returns True or false depending on if (x, y) is on the curve or not.
             */
            isOnCurve(x, y) {
                const fx = this.f(x);
                const y2 = y.mul(y).mod(this.cp);
                return fx.equals(y2);
            }
            getElementOrder() {
                return this.pRing.order;
            }
            getg() {
                return this.generator;
            }
            getONE() {
                return this.ONE;
            }
            toElement(byteTree) {
                if (byteTree.isLeaf()) {
                    throw Error("Byte tree is a leaf, expected a node!");
                } else if (byteTree.value.length !== 2) {
                    throw Error("Byte tree does not have 2 children!");
                } else {
                    const xByteTree = byteTree.value[0];
                    const yByteTree = byteTree.value[1];
                    if (!xByteTree.isLeaf()) {
                        throw Error("First byte tree is not a leaf!");
                    } else if (!yByteTree.isLeaf()) {
                        throw Error("Second byte tree is not a leaf!");
                    } else {
                        const xa = xByteTree.value;
                        const ya = yByteTree.value;
                        if (xa.length !== this.modulusByteLength) {
                            throw Error("The x-coordinate array has the wrong length!");
                        } else if (ya.length !== this.modulusByteLength) {
                            throw Error("The y-coordinate array has the wrong length!");
                        } else {
                            for (let i = 0; i < xa.length; i++) {
                                if (xa[i] !== 0xFF || ya[i] !== 0xFF) {
                                    const x = new LI(xa);
                                    const y = new LI(ya);
                                    return new ECqPGroupElement(this, this.toECP(x, y));
                                }
                            }
                            // The point at infinity is represented by the
                            // pair (-1, -1) in "affine coordinates" and we
                            // end up here.
                            return new ECqPGroupElement(this, this.toECP(LI.ZERO, LI.ONE, LI.ZERO));
                        }
                    }
                }
            }
            encode(bytes, startIndex, length) {
                let fx;
                if (typeof startIndex === "undefined") {
                    startIndex = 0;
                    length = bytes.length;
                }
                if (length > this.encodeLength) {
                    throw Error("Too many bytes to encode! (" +
                        length + " > " + this.encodeLength + ")");
                } else {
                    const bytesToUse = [];
                    bytesToUse.length = this.encodeLength + 3;
                    let i = 0;
                    while (i < this.encodeLength - length) {
                        bytesToUse[i] = 0;
                        i++;
                    }
                    let j = startIndex;
                    while (i < this.encodeLength) {
                        bytesToUse[i] = bytes[j];
                        i++;
                        j++;
                    }
                    while (i < bytesToUse.length - 3) {
                        bytesToUse[i] = 0;
                        i++;
                    }
                    setUint16ToByteArray(bytesToUse, length, this.encodeLength);
                    let x = new LI(bytesToUse);
                    let square = false;
                    do {
                        fx = this.f(x);
                        if (fx.legendre(this.cp) === 1) {
                            square = true;
                        } else {
                            x = x.add(LI.ONE);
                        }
                    } while (!square);
                    let y = fx.modSqrt(this.cp);
                    // Choose smallest integer root representative.
                    const yneg = this.cp.sub(y);
                    if (yneg.cmp(y) < 0) {
                        y = yneg;
                    }
                    return new ECqPGroupElement(this, this.toECP(x, y));
                }
            }
            randomElement(randomSource, statDist) {
                const bitLength = this.cp.bitLength() + statDist;
                let x;
                let fx;
                let square = false;
                do {
                    // Generate a new random element modulo this.cp.
                    x = new LI(bitLength, randomSource);
                    x = x.mod(this.cp);
                    fx = this.f(x);
                    // Check if f(x) is a quadratic residue.
                    if (fx.legendre(this.cp) === 1) {
                        square = true;
                    }
                } while (!square);
                // Compute square root of f(x).
                let y = fx.modSqrt(this.cp);
                // Choose smallest root integer representative.
                const yneg = this.cp.sub(y);
                if (yneg.cmp(y) < 0) {
                    y = yneg;
                }
                return new ECqPGroupElement(this, this.toECP(x, y));
            }
            toString() {
                return this.cp.toHexString() + ":" +
                    this.getElementOrder().toHexString() + ":" +
                    this.generator.toString();
            }
            toByteTree() {
                return new ByteTree(asciiToByteArray(this.groupName));
            }
            /**
             * Returns true or false depending on if a standardized group is
             * registered with the given name.
             *
             * @param groupName - Name of standardized group.
             * @returns True if the group is registered and false otherwise.
             */
            static hasPGroup(groupName) {
                return algebra.ECqPGroup_named.has(groupName);
            }
            /**
             * Returns the parameters of the given named group.
             * @returns Parameters of the named group.
             */
            static getParams(groupName) {
                if (algebra.ECqPGroup_named.has(groupName)) {
                    return algebra.ECqPGroup_named.get(groupName);
                } else {
                    throw Error("Unknown group name! (" + groupName + ")");
                }
            }
            /**
             * Returns the group with the given name.
             * @returns Named group.
             */
            static getPGroup(groupName) {
                const params = ECqPGroup.getParams(groupName);
                const modulus = new LI(params[0]);
                const a = new LI(params[1]);
                const b = new LI(params[2]);
                const gx = new LI(params[3]);
                const gy = new LI(params[4]);
                const n = new LI(params[5]);
                return new ECqPGroup(groupName, modulus, a, b, gx, gy, n);
            }
            /**
             * Returns an array of all available curve names.
             * @returns Array of all available curve names.
             */
            static getPGroupNames() {
                const groupNames = [];
                let i = 0;
                for (const key of algebra.ECqPGroup_named.keys()) {
                    groupNames[i++] = key;
                }
                return groupNames;
            }
            /**
             * Returns an array of all available curves.
             * @returns Array of all available curves.
             */
            static getPGroups() {
                const pGroupNames = ECqPGroup.getPGroupNames();
                const pGroups = [];
                for (let i = 0; i < pGroupNames.length; i++) {
                    pGroups[i] = ECqPGroup.getPGroup(pGroupNames[i]);
                }
                return pGroups;
            }
            /**
             * Recovers a ECqPGroup instance from its representation
             * as a byte tree.
             *
             * @param byteTree - Byte tree representation of a ECqPGroup instance.
             * @returns Instance of ECqPGroup.
             */
            static fromByteTree(byteTree) {
                if (byteTree.isLeaf()) {
                    const value = byteTree.value;
                    const groupName = byteArrayToAscii(value);
                    return ECqPGroup.getPGroup(groupName);
                } else {
                    throw Error("Byte tree is not a leaf!");
                }
            }
            toECP(x, y, z) {
                if (typeof z === "undefined") {
                    z = LI.ONE;
                }
                return new ECP(this.curve.length, x, y, z);
            }
        }
        algebra.ECqPGroup = ECqPGroup;
        /**
         * Element of {@link ECqPGroup}.
         */
        class ECqPGroupElement extends PGroupElement {
            /**
             * Creates a group element.
             *
             * @param pGroup - Group to which this point belongs.
             * @param value - Instance of {@link ec.ECP}.
             */
            constructor(pGroup, value) {
                super(pGroup);
                this.curve = pGroup.curve;
                this.value = value;
            }
            equals(other) {
                this.assertType(other);
                return this.curve.equals(this.value, other.value);
            }
            mul(factor) {
                this.assertType(factor);
                const A = new ECP(this.curve.length);
                const B = this.value;
                const C = factor.value;
                this.curve.jadd(A, B, C);
                return new ECqPGroupElement(this.pGroup, A);
            }
            square() {
                const A = new ECP(this.curve.length);
                const B = this.value;
                this.curve.jdbl(A, B);
                return new ECqPGroupElement(this.pGroup, A);
            }
            /* eslint-disable @typescript-eslint/no-unused-vars */
            fixed(exponentiations) {
                // We do not precompute for elliptic curves.
            }
            exp(exponent) {
                const A = new ECP(this.curve.length);
                const B = this.value;
                let largeIntegerExponent;
                if (exponent.getName() === "PFieldElement") {
                    largeIntegerExponent = exponent.value;
                } else {
                    largeIntegerExponent = exponent;
                }
                this.curve.jmul(A, B, largeIntegerExponent);
                return new ECqPGroupElement(this.pGroup, A);
            }
            inv() {
                const A = new ECP(this.curve.length);
                const B = this.value;
                this.curve.neg(A, B);
                return new ECqPGroupElement(this.pGroup, A);
            }
            toByteTree() {
                const len = this.pGroup.modulusByteLength;
                this.curve.affine(this.value);
                if (iszero(this.value.z)) {
                    // This is a safe internal representation of the unit element,
                    // since there are no usable Mersenne primes within the range
                    // of usable moduli.
                    const FF = fill(0xFF, len);
                    return new ByteTree([new ByteTree(FF), new ByteTree(FF)]);
                } else {
                    const x = new LI(this.value.x.sign, this.value.x.value);
                    const y = new LI(this.value.y.sign, this.value.y.value);
                    const xbt = new ByteTree(x.toByteArray(len));
                    const ybt = new ByteTree(y.toByteArray(len));
                    return new ByteTree([xbt, ybt]);
                }
            }
            toString() {
                this.curve.affine(this.value);
                if (iszero(this.value.z)) {
                    return "(O)";
                } else {
                    const xs = hex(this.value.x);
                    const ys = hex(this.value.y);
                    return "(" + xs + "," + ys + ")";
                }
            }
            decode(destination, startIndex) {
                this.curve.affine(this.value);
                // We encode nothing in the point at infinity.
                if (iszero(this.value.z)) {
                    return 0;
                } else {
                    // Strip the last byte, read the length, and copy bytes.
                    const x = new LI(this.value.x.sign, this.value.x.value);
                    const elen = this.pGroup.encodeLength;
                    const xbytes = x.toByteArray(elen + 3);
                    const len = readUint16FromByteArray(xbytes, elen);
                    let i = startIndex;
                    let j = this.pGroup.encodeLength - len;
                    while (j < this.pGroup.encodeLength) {
                        destination[i] = xbytes[j];
                        i++;
                        j++;
                    }
                    return len;
                }
            }
        }
        algebra.ECqPGroupElement = ECqPGroupElement;
        algebra.ECqPGroup_named = new Map();
        algebra.ECqPGroup_named.set("brainpoolp192r1", ["c302f41d932a36cda7a3463093d18db78fce476de1a86297",
            "6a91174076b1e0e19c39c031fe8685c1cae040e5c69a28ef",
            "469a28ef7c28cca3dc721d044f4496bcca7ef4146fbf25c9",
            "c0a0647eaab6a48753b033c56cb0f0900a2f5c4853375fd6",
            "14b690866abd5bb88b5f4828c1490002e6773fa2fa299b8f",
            "c302f41d932a36cda7a3462f9e9e916b5be8f1029ac4acc1",
            "1"
        ]);
        algebra.ECqPGroup_named.set("brainpoolp224r1", ["d7c134aa264366862a18302575d1d787b09f075797da89f57ec8c0ff",
            "68a5e62ca9ce6c1c299803a6c1530b514e182ad8b0042a59cad29f43",
            "2580f63ccfe44138870713b1a92369e33e2135d266dbb372386c400b",
            "d9029ad2c7e5cf4340823b2a87dc68c9e4ce3174c1e6efdee12c07d",
            "58aa56f772c0726f24c6b89e4ecdac24354b9e99caa3f6d3761402cd",
            "d7c134aa264366862a18302575d0fb98d116bc4b6ddebca3a5a7939f",
            "1"
        ]);
        algebra.ECqPGroup_named.set("brainpoolp256r1", ["a9fb57dba1eea9bc3e660a909d838d726e3bf623d52620282013481d1f6e5377",
            "7d5a0975fc2c3057eef67530417affe7fb8055c126dc5c6ce94a4b44f330b5d9",
            "26dc5c6ce94a4b44f330b5d9bbd77cbf958416295cf7e1ce6bccdc18ff8c07b6",
            "8bd2aeb9cb7e57cb2c4b482ffc81b7afb9de27e1e3bd23c23a4453bd9ace3262",
            "547ef835c3dac4fd97f8461a14611dc9c27745132ded8e545c1d54c72f046997",
            "a9fb57dba1eea9bc3e660a909d838d718c397aa3b561a6f7901e0e82974856a7",
            "1"
        ]);
        algebra.ECqPGroup_named.set("brainpoolp320r1", ["d35e472036bc4fb7e13c785ed201e065f98fcfa6f6f40def4f92b9ec7893ec28fcd412b1f1b32e27",
            "3ee30b568fbab0f883ccebd46d3f3bb8a2a73513f5eb79da66190eb085ffa9f492f375a97d860eb4",
            "520883949dfdbc42d3ad198640688a6fe13f41349554b49acc31dccd884539816f5eb4ac8fb1f1a6",
            "43bd7e9afb53d8b85289bcc48ee5bfe6f20137d10a087eb6e7871e2a10a599c710af8d0d39e20611",
            "14fdd05545ec1cc8ab4093247f77275e0743ffed117182eaa9c77877aaac6ac7d35245d1692e8ee1",
            "d35e472036bc4fb7e13c785ed201e065f98fcfa5b68f12a32d482ec7ee8658e98691555b44c59311",
            "1"
        ]);
        algebra.ECqPGroup_named.set("brainpoolp384r1", ["8cb91e82a3386d280f5d6f7e50e641df152f7109ed5456b412b1da197fb71123acd3a729901d1a71874700133107ec53",
            "7bc382c63d8c150c3c72080ace05afa0c2bea28e4fb22787139165efba91f90f8aa5814a503ad4eb04a8c7dd22ce2826",
            "4a8c7dd22ce28268b39b55416f0447c2fb77de107dcd2a62e880ea53eeb62d57cb4390295dbc9943ab78696fa504c11",
            "1d1c64f068cf45ffa2a63a81b7c13f6b8847a3e77ef14fe3db7fcafe0cbd10e8e826e03436d646aaef87b2e247d4af1e",
            "8abe1d7520f9c2a45cb1eb8e95cfd55262b70b29feec5864e19c054ff99129280e4646217791811142820341263c5315",
            "8cb91e82a3386d280f5d6f7e50e641df152f7109ed5456b31f166e6cac0425a7cf3ab6af6b7fc3103b883202e9046565",
            "1"
        ]);
        algebra.ECqPGroup_named.set("brainpoolp512r1", ["aadd9db8dbe9c48b3fd4e6ae33c9fc07cb308db3b3c9d20ed6639cca703308717d4d9b009bc66842aecda12ae6a380e62881ff2f2d82c68528aa6056583a48f3",
            "7830a3318b603b89e2327145ac234cc594cbdd8d3df91610a83441caea9863bc2ded5d5aa8253aa10a2ef1c98b9ac8b57f1117a72bf2c7b9e7c1ac4d77fc94ca",
            "3df91610a83441caea9863bc2ded5d5aa8253aa10a2ef1c98b9ac8b57f1117a72bf2c7b9e7c1ac4d77fc94cadc083e67984050b75ebae5dd2809bd638016f723",
            "81aee4bdd82ed9645a21322e9c4c6a9385ed9f70b5d916c1b43b62eef4d0098eff3b1f78e2d0d48d50d1687b93b97d5f7c6d5047406a5e688b352209bcb9f822",
            "7dde385d566332ecc0eabfa9cf7822fdf209f70024a57b1aa000c55b881f8111b2dcde494a5f485e5bca4bd88a2763aed1ca2b2fa8f0540678cd1e0f3ad80892",
            "aadd9db8dbe9c48b3fd4e6ae33c9fc07cb308db3b3c9d20ed6639cca70330870553e5c414ca92619418661197fac10471db1d381085ddaddb58796829ca90069",
            "1"
        ]);
        algebra.ECqPGroup_named.set("P-192", ["fffffffffffffffffffffffffffffffeffffffffffffffff",
            "fffffffffffffffffffffffffffffffefffffffffffffffc",
            "64210519e59c80e70fa7e9ab72243049feb8deecc146b9b1",
            "188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012",
            "7192b95ffc8da78631011ed6b24cdd573f977a11e794811",
            "ffffffffffffffffffffffff99def836146bc9b1b4d22831",
            "1"
        ]);
        algebra.ECqPGroup_named.set("P-224", ["ffffffffffffffffffffffffffffffff000000000000000000000001",
            "fffffffffffffffffffffffffffffffefffffffffffffffffffffffe",
            "b4050a850c04b3abf54132565044b0b7d7bfd8ba270b39432355ffb4",
            "b70e0cbd6bb4bf7f321390b94a03c1d356c21122343280d6115c1d21",
            "bd376388b5f723fb4c22dfe6cd4375a05a07476444d5819985007e34",
            "ffffffffffffffffffffffffffff16a2e0b8f03e13dd29455c5c2a3d",
            "1"
        ]);
        algebra.ECqPGroup_named.set("P-256", ["ffffffff00000001000000000000000000000000ffffffffffffffffffffffff",
            "ffffffff00000001000000000000000000000000fffffffffffffffffffffffc",
            "5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b",
            "6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296",
            "4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5",
            "ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551",
            "1"
        ]);
        algebra.ECqPGroup_named.set("P-384", ["fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000ffffffff",
            "fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000fffffffc",
            "b3312fa7e23ee7e4988e056be3f82d19181d9c6efe8141120314088f5013875ac656398d8a2ed19d2a85c8edd3ec2aef",
            "aa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7",
            "3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f",
            "ffffffffffffffffffffffffffffffffffffffffffffffffc7634d81f4372ddf581a0db248b0a77aecec196accc52973",
            "1"
        ]);
        algebra.ECqPGroup_named.set("P-521", ["1ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
            "1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc",
            "51953eb9618e1c9a1f929a21a0b68540eea2da725b99b315f3b8b489918ef109e156193951ec7e937b1652c0bd3bb1bf073573df883d2c34f1ef451fd46b503f00",
            "c6858e06b70404e9cd9e3ecb662395b4429c648139053fb521f828af606b4d3dbaa14b5e77efe75928fe1dc127a2ffa8de3348b3c1856a429bf97e7e31c2e5bd66",
            "11839296a789a3bc0045c8a5fb42c7d1bd998f54449579b446817afbd17273e662c97ee72995ef42640c550b9013fad0761353c7086a272c24088be94769fd16650",
            "1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa51868783bf2f966b7fcc0148f709a5d03bb5c9b8899c47aebb6fb71e91386409",
            "1"
        ]);
        algebra.ECqPGroup_named.set("prime192v1", ["fffffffffffffffffffffffffffffffeffffffffffffffff",
            "fffffffffffffffffffffffffffffffefffffffffffffffc",
            "64210519e59c80e70fa7e9ab72243049feb8deecc146b9b1",
            "188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012",
            "7192b95ffc8da78631011ed6b24cdd573f977a11e794811",
            "ffffffffffffffffffffffff99def836146bc9b1b4d22831",
            "1"
        ]);
        algebra.ECqPGroup_named.set("prime192v2", ["fffffffffffffffffffffffffffffffeffffffffffffffff",
            "fffffffffffffffffffffffffffffffefffffffffffffffc",
            "cc22d6dfb95c6b25e49c0d6364a4e5980c393aa21668d953",
            "eea2bae7e1497842f2de7769cfe9c989c072ad696f48034a",
            "6574d11d69b6ec7a672bb82a083df2f2b0847de970b2de15",
            "fffffffffffffffffffffffe5fb1a724dc80418648d8dd31",
            "1"
        ]);
        algebra.ECqPGroup_named.set("prime192v3", ["fffffffffffffffffffffffffffffffeffffffffffffffff",
            "fffffffffffffffffffffffffffffffefffffffffffffffc",
            "22123dc2395a05caa7423daeccc94760a7d462256bd56916",
            "7d29778100c65a1da1783716588dce2b8b4aee8e228f1896",
            "38a90f22637337334b49dcb66a6dc8f9978aca7648a943b0",
            "ffffffffffffffffffffffff7a62d031c83f4294f640ec13",
            "1"
        ]);
        algebra.ECqPGroup_named.set("prime239v1", ["7fffffffffffffffffffffff7fffffffffff8000000000007fffffffffff",
            "7fffffffffffffffffffffff7fffffffffff8000000000007ffffffffffc",
            "6b016c3bdcf18941d0d654921475ca71a9db2fb27d1d37796185c2942c0a",
            "ffa963cdca8816ccc33b8642bedf905c3d358573d3f27fbbd3b3cb9aaaf",
            "7debe8e4e90a5dae6e4054ca530ba04654b36818ce226b39fccb7b02f1ae",
            "7fffffffffffffffffffffff7fffff9e5e9a9f5d9071fbd1522688909d0b",
            "1"
        ]);
        algebra.ECqPGroup_named.set("prime239v3", ["7fffffffffffffffffffffff7fffffffffff8000000000007fffffffffff",
            "7fffffffffffffffffffffff7fffffffffff8000000000007ffffffffffc",
            "255705fa2a306654b1f4cb03d6a750a30c250102d4988717d9ba15ab6d3e",
            "6768ae8e18bb92cfcf005c949aa2c6d94853d0e660bbf854b1c9505fe95a",
            "1607e6898f390c06bc1d552bad226f3b6fcfe48b6e818499af18e3ed6cf3",
            "7fffffffffffffffffffffff7fffff975deb41b3a6057c3c432146526551",
            "1"
        ]);
        algebra.ECqPGroup_named.set("prime256v1", ["ffffffff00000001000000000000000000000000ffffffffffffffffffffffff",
            "ffffffff00000001000000000000000000000000fffffffffffffffffffffffc",
            "5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b",
            "6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296",
            "4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5",
            "ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551",
            "1"
        ]);
        algebra.ECqPGroup_named.set("secp192k1", ["fffffffffffffffffffffffffffffffffffffffeffffee37",
            "0",
            "3",
            "db4ff10ec057e9ae26b07d0280b7f4341da5d1b1eae06c7d",
            "9b2f2f6d9c5628a7844163d015be86344082aa88d95e2f9d",
            "fffffffffffffffffffffffe26f2fc170f69466a74defd8d",
            "1"
        ]);
        algebra.ECqPGroup_named.set("secp192r1", ["fffffffffffffffffffffffffffffffeffffffffffffffff",
            "fffffffffffffffffffffffffffffffefffffffffffffffc",
            "64210519e59c80e70fa7e9ab72243049feb8deecc146b9b1",
            "188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012",
            "7192b95ffc8da78631011ed6b24cdd573f977a11e794811",
            "ffffffffffffffffffffffff99def836146bc9b1b4d22831",
            "1"
        ]);
        algebra.ECqPGroup_named.set("secp224k1", ["fffffffffffffffffffffffffffffffffffffffffffffffeffffe56d",
            "0",
            "5",
            "a1455b334df099df30fc28a169a467e9e47075a90f7e650eb6b7a45c",
            "7e089fed7fba344282cafbd6f7e319f7c0b0bd59e2ca4bdb556d61a5",
            "10000000000000000000000000001dce8d2ec6184caf0a971769fb1f7",
            "1"
        ]);
        algebra.ECqPGroup_named.set("secp224r1", ["ffffffffffffffffffffffffffffffff000000000000000000000001",
            "fffffffffffffffffffffffffffffffefffffffffffffffffffffffe",
            "b4050a850c04b3abf54132565044b0b7d7bfd8ba270b39432355ffb4",
            "b70e0cbd6bb4bf7f321390b94a03c1d356c21122343280d6115c1d21",
            "bd376388b5f723fb4c22dfe6cd4375a05a07476444d5819985007e34",
            "ffffffffffffffffffffffffffff16a2e0b8f03e13dd29455c5c2a3d",
            "1"
        ]);
        algebra.ECqPGroup_named.set("secp256k1", ["fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f",
            "0",
            "7",
            "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
            "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8",
            "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
            "1"
        ]);
        algebra.ECqPGroup_named.set("secp256r1", ["ffffffff00000001000000000000000000000000ffffffffffffffffffffffff",
            "ffffffff00000001000000000000000000000000fffffffffffffffffffffffc",
            "5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b",
            "6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296",
            "4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5",
            "ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551",
            "1"
        ]);
        algebra.ECqPGroup_named.set("secp384r1", ["fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000ffffffff",
            "fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000fffffffc",
            "b3312fa7e23ee7e4988e056be3f82d19181d9c6efe8141120314088f5013875ac656398d8a2ed19d2a85c8edd3ec2aef",
            "aa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7",
            "3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f",
            "ffffffffffffffffffffffffffffffffffffffffffffffffc7634d81f4372ddf581a0db248b0a77aecec196accc52973",
            "1"
        ]);
        algebra.ECqPGroup_named.set("secp521r1", ["1ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
            "1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc",
            "51953eb9618e1c9a1f929a21a0b68540eea2da725b99b315f3b8b489918ef109e156193951ec7e937b1652c0bd3bb1bf073573df883d2c34f1ef451fd46b503f00",
            "c6858e06b70404e9cd9e3ecb662395b4429c648139053fb521f828af606b4d3dbaa14b5e77efe75928fe1dc127a2ffa8de3348b3c1856a429bf97e7e31c2e5bd66",
            "11839296a789a3bc0045c8a5fb42c7d1bd998f54449579b446817afbd17273e662c97ee72995ef42640c550b9013fad0761353c7086a272c24088be94769fd16650",
            "1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa51868783bf2f966b7fcc0148f709a5d03bb5c9b8899c47aebb6fb71e91386409",
            "1"
        ]);
        /**
         * Utility functions for treating groups abstractly.
         */
        class PGroupFactory {
            static getGroupTypes() {
                return [
                    "ModPGroup",
                    "ECqPGroup"
                ];
            }
            /**
             * Recovers a group from its marshalled representation. The
             * marshal function is defined in {@link PGroup}.
             *
             * @param representation - Representation of group.
             * @returns Group represented by the input.
             */
            static unmarshalPGroup(representation) {
                // Make sure that we start with a byte tree representation.
                let byteTree;
                if (typeof representation === "string") {
                    byteTree = new ByteTree(representation);
                } else {
                    byteTree = representation;
                }
                // The byte tree should have two children: (1) the classname
                // stored as a leaf, and (2) the representation of the group
                // of that class as a byte tree.
                if (byteTree.isLeaf()) {
                    throw Error("A leaf is never a marshalled group!");
                } else if (byteTree.value.length != 2) {
                    throw Error("A marshalled group has exactly two children!");
                }
                const gnbt = byteTree.value[0];
                const gdbt = byteTree.value[1];
                // Name of class to instantiate.
                let className;
                if (gnbt.isLeaf()) {
                    className = byteArrayToAscii(gnbt.value);
                } else {
                    throw Error("The first child must be a leaf containing " +
                        "the classname of the group!");
                }
                // Instantiate from representation or throw error.
                if (className === "ModPGroup") {
                    return ModPGroup.fromByteTree(gdbt);
                } else if (className === "ECqPGroup") {
                    return ECqPGroup.fromByteTree(gdbt);
                } else if (className === "PPGroup") {
                    return PPGroup.fromByteTree(gdbt);
                } else {
                    throw Error("Unknown group classname! (" + className + ")");
                }
            }
            /**
             * Returns the group with the given name.
             * @returns Named group.
             */
            static getPGroup(groupName) {
                if (ModPGroup.hasPGroup(groupName)) {
                    return ModPGroup.getPGroup(groupName);
                } else if (ECqPGroup.hasPGroup(groupName)) {
                    return ECqPGroup.getPGroup(groupName);
                } else {
                    throw Error("Unknown group name! (" + groupName + ")");
                }
            }
            /**
             * Returns a list of named registered standard groups.
             * @returns List of named registered standard groups.
             */
            static getPGroups(groupNames) {
                const pGroups = [];
                for (let i = 0; i < groupNames.length; i++) {
                    pGroups.push(PGroupFactory.getPGroup(groupNames[i]));
                }
                return pGroups;
            }
            /**
             * Returns a product group, or the input group, if
             * the given width equals one.
             *
             * @param pGroup - Basic group.
             * @param keyWidth - Width of product group.
             * @returns Input group or product group.
             */
            static getWideGroup(pGroup, keyWidth) {
                if (keyWidth > 1) {
                    return new PPGroup([pGroup, keyWidth]);
                } else {
                    return pGroup;
                }
            }
            /**
             * Returns a list of the smallest available groups of
             * the implemented types of groups.
             */
            static getSmallPGroups() {
                const pGroups = [];
                const mpGroups = ModPGroup.getPGroups();
                if (mpGroups.length > 0) {
                    let ssmGroup = mpGroups[0];
                    for (let j = 1; j < mpGroups.length; j++) {
                        if (mpGroups[j].getElementOrder().cmp(ssmGroup.getElementOrder()) < 0) {
                            ssmGroup = mpGroups[j];
                        }
                    }
                    pGroups.push(ssmGroup);
                }
                const ecGroups = ECqPGroup.getPGroups();
                if (ecGroups.length > 0) {
                    let ssmGroup = ecGroups[0];
                    for (let j = 1; j < ecGroups.length; j++) {
                        if (ecGroups[j].getElementOrder().cmp(ssmGroup.getElementOrder()) < 0) {
                            ssmGroup = ecGroups[j];
                        }
                    }
                    pGroups.push(ssmGroup);
                }
                if (pGroups.length === 0) {
                    throw Error("No standard groups available!");
                } else {
                    return pGroups;
                }
            }
        }
        algebra.PGroupFactory = PGroupFactory;
        /**
         * Homomorphism from a ring to a group.
         *
         * @param domain - Domain of homomorphism.
         * @param range - Range of homomorphism.
         */
        class Hom {
            constructor(domain, range) {
                this.domain = domain;
                this.range = range;
            }
        }
        algebra.Hom = Hom;
        /**
         * Exponentiation homomorphism from a ring to a
         * group. Note that the group is not necessarily a prime order group,
         * that the ring is not necessarily a field, and that the ring is not
         * necessarily the ring of exponents of group.
         *
         * @param basis - Basis element that is exponentiated.
         * @param domain - Domain of homomorphism, which may be a subring of the
         * ring of exponents of the basis element.
         */
        class ExpHom extends Hom {
            constructor(domain, basis) {
                super(domain, basis.pGroup);
                this.basis = basis;
            }
            eva(value) {
                return this.basis.exp(value);
            }
        }
        algebra.ExpHom = ExpHom;
        /**
         * Product of powers as a homomorphism.
         */
        class PowProdHom extends Hom {
            /**
             * Creates a homomorphism.
             *
             * @param domain - Domain of homomorphism.
             * @param domain - Bases which define the homomorphism.
             */
            constructor(domain, bases) {
                super(domain, bases[0].pGroup);
                if (ofClass(domain, PPRing)) {
                    const d = domain;
                    if (d.pRings.length !== bases.length) {
                        throw Error("Mismatching domain and bases lengths! (" +
                            d.pRings.length + " != " + bases.length + ")");
                    }
                    this.bases = bases;
                } else {
                    throw Error("Domain is not a product ring!");
                }
            }
            /**
             * Evaluates the homomorphism.
             *
             * @param value - Point at which the homomorphism is evaluated.
             * @returns Value of the homomorphism at this point.
             */
            eva(value) {
                if (ofClass(value, PPRingElement)) {
                    const v = value;
                    if (v.values.length !== this.bases.length) {
                        throw Error("Mismatching value and bases lengths! (" +
                            v.values.length + " != " + this.bases.length + ")");
                    }
                    let res = this.bases[0].pGroup.getONE();
                    for (let i = 0; i < this.bases.length; i++) {
                        res = res.mul(this.bases[i].exp(v.values[i]));
                    }
                    return res;
                } else {
                    throw Error("Input is not a product element!");
                }
            }
        }
        algebra.PowProdHom = PowProdHom;
    })(algebra = verificatum.algebra || (verificatum.algebra = {}));
    let crypto;
    (function(crypto) {
        var ByteTree = verificatum.algebra.ByteTree;
        var ExpHom = verificatum.algebra.ExpHom;
        var PGroupFactory = verificatum.algebra.PGroupFactory;
        var PPGroup = verificatum.algebra.PPGroup;
        var PPRing = verificatum.algebra.PPRing;
        var PRingElement = verificatum.algebra.PRingElement;
        var RandomSource = verificatum.base.RandomSource;
        var asByteArray = verificatum.base.asByteArray;
        var byteArrayToAscii = verificatum.base.byteArrayToAscii;
        var byteArrayToHex = verificatum.base.byteArrayToHex;
        var fill = verificatum.base.fill;
        var hexToByteArray = verificatum.base.hexToByteArray;
        var isByteArray = verificatum.base.isByteArray;
        var isHexString = verificatum.base.isHexString;
        var ofClass = verificatum.base.ofClass;
        var ofSubclass = verificatum.base.ofSubclass;
        var setUint32ToByteArray = verificatum.base.setUint32ToByteArray;
        /**
         * Hash function.
         */
        class Hashfunction {
            /**
             * @param range - Number of bytes of range.
             */
            constructor(range) {
                this.range = range;
            }
        }
        crypto.Hashfunction = Hashfunction;
        // Number of bytes in a block.
        const bs = 16 * 4;
        // Initial contents of state.
        const initial_H = [
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
            0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
        ];
        // Constants used during processing.
        const k = [
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
            0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
            0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
            0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
            0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
            0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
            0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
            0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
            0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
            0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
            0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
            0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
            0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
            0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
            0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
        ];
        /**
         * Right rotates the input word by the given number of steps.
         *
         * @param w - Word to be rotated.
         * @param r - Number of steps.
         * @returns Rotated word.
         */
        function rotr(w, r) {
            return w >>> r | w << 32 - r;
        }
        /**
         * Fills w with the given bytes and zeroes out the remaining bytes.
         *
         * @param w - Array to be filled.
         * @param bytes - Source bytes.
         * @param offset - From where in the source bytes we start reading.
         */
        function fill_prefix_of_w(w, bytes, offset) {
            let i;
            let l;
            // Clear contents of w.
            for (i = 0; i < 16; i++) {
                w[i] = 0;
            }
            // Fill words in prefix of w until it is complete or until we run
            // out of input bytes.
            l = offset;
            i = 0;
            while (i < 16 && l < bytes.length) {
                w[i] = w[i] << 8 | bytes[l];
                if (l % 4 === 3) {
                    i++;
                }
                l++;
            }
            // If we ran out of bytes, then this is the last chunk of bytes
            // and there is room for a padding byte with the leading bit set.
            if (i < 16) {
                w[i] = w[i] << 8 | 0x80;
                const b = 4 - l % 4 - 1;
                w[i] <<= 8 * b;
                i++;
            }
        }
        /**
         * Merges a complete block into the given state.
         *
         * @param H - State updated by this function.
         * @param w - Complete block.
         */
        function process(H, w) {
            let i;
            let a = H[0];
            let b = H[1];
            let c = H[2];
            let d = H[3];
            let e = H[4];
            let f = H[5];
            let g = H[6];
            let h = H[7];
            let s0;
            let s1;
            let S0;
            let S1;
            let ch;
            let maj;
            let temp1;
            let temp2;
            // Expand prefix of w of length 16 to 64 words.
            for (i = 16; i < 64; i++) {
                s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ w[i - 15] >>> 3;
                s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ w[i - 2] >>> 10;
                w[i] = w[i - 16] + s0 + w[i - 7] + s1;
            }
            // Compute one round over all 64 words.
            for (i = 0; i < 64; i++) {
                S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
                ch = e & f ^ ~e & g;
                temp1 = h + S1 + ch + k[i] + w[i] | 0;
                S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
                maj = a & b ^ a & c ^ b & c;
                temp2 = S0 + maj | 0;
                h = g;
                g = f;
                f = e;
                e = d + temp1 | 0;
                d = c;
                c = b;
                b = a;
                a = temp1 + temp2 | 0;
            }
            // Update the state.
            H[0] = H[0] + a | 0;
            H[1] = H[1] + b | 0;
            H[2] = H[2] + c | 0;
            H[3] = H[3] + d | 0;
            H[4] = H[4] + e | 0;
            H[5] = H[5] + f | 0;
            H[6] = H[6] + g | 0;
            H[7] = H[7] + h | 0;
        }
        /**
         * Simplistic implementation of SHA-256 based on <a
         * href="http://en.wikipedia.org/wiki/SHA-2">Wikipedia SHA-2
         * pseudo-code</a>. The goal is clarity and not speed.
         *
         * @param bytes - Array of bytes.
         */
        class SHA256 extends Hashfunction {
            constructor() {
                super(32);
                // State.
                this.H = [
                    0, 0, 0, 0,
                    0, 0, 0, 0
                ];
                // Working memory.
                this.w = [
                    0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0
                ];
            }
            /**
             * Hashes the input bytes and outputs a diges.
             *
             * @param bytes - Bytes to be hashed.
             * @returns Hash digest.
             */
            hash(bytes) {
                let i;
                let j;
                // Initialize state.
                for (i = 0; i < 8; i++) {
                    this.H[i] = initial_H[i];
                }
                // Number of complete blocks.
                const blocks = Math.floor(bytes.length / bs);
                // Process complete blocks.
                let offset = 0;
                for (j = 0; j < blocks; j++) {
                    fill_prefix_of_w(this.w, bytes, offset);
                    process(this.H, this.w);
                    offset += bs;
                }
                // Determine how many extra blocks there are.
                const extra = bytes.length % bs;
                // Fill with remaining bytes and pad with "1000..." to get a
                // complete block.
                fill_prefix_of_w(this.w, bytes, offset);
                // If there is no room for embedding the length in the current
                // block, then we process it and add an additional empty
                // block.
                if (extra + 9 > bs) {
                    process(this.H, this.w);
                    for (i = 0; i < 16; i++) {
                        this.w[i] = 0;
                    }
                }
                // We know that there is room for embedding the bit length as
                // a 64 bit unsigned integer now and do that in the last two
                // words of the block.
                let bits = 8 * bytes.length;
                this.w[15] = bits & 0xFFFFFFFF;
                bits = Math.floor(bits / Math.pow(2, 32));
                this.w[14] = bits & 0xFFFFFFFF;
                // We process the last block which has the bit length embedded
                // in the last two words as a 64-bit unsigned integer.
                process(this.H, this.w);
                // Finally we convert the state consisting of 8 unsigned
                // 32-bit integers to a digest of 32 bytes.
                const D = [];
                let l = 0;
                for (i = 0; i < this.H.length; i++) {
                    for (j = 3; j >= 0; j--) {
                        D[l] = this.H[i] >>> j * 8 & 0xFF;
                        l++;
                    }
                }
                return D;
            }
        }
        crypto.SHA256 = SHA256;
        /**
         * Pseudo-random generator based on SHA-256 in counter
         * mode.
         */
        class SHA256PRG extends RandomSource {
            constructor() {
                super();
                this.sha256 = new SHA256();
                this.seedLength = 32;
                this.input = [];
                this.counter = 0;
                this.buffer = [];
                this.index = 0;
            }
            /**
             * Initializes this PRG with the given seed.
             *
             * @param seed - Seed bytes.
             */
            setSeed(seed) {
                if (seed.length >= 32) {
                    this.input = seed.slice(0, 32);
                    // Make room for counter in input.
                    this.input.length += 4;
                    this.counter = 0;
                    this.buffer = [];
                    this.index = 0;
                } else {
                    throw Error("Too short seed!");
                }
            }
            getBytes(len) {
                if (this.input.length === 0) {
                    throw Error("Uninitialized PRG!");
                }
                const res = [];
                res.length = len;
                for (let i = 0; i < res.length; i++) {
                    // If we reach the end of the buffer, then we hash the
                    // input, reset our source index, and increment the
                    // counter.
                    if (this.index === this.buffer.length) {
                        setUint32ToByteArray(this.input, this.counter, 32);
                        this.buffer = this.sha256.hash(this.input);
                        this.index = 0;
                        this.counter++;
                    }
                    res[i] = this.buffer[this.index];
                    this.index++;
                }
                return res;
            }
        }
        crypto.SHA256PRG = SHA256PRG;
        /**
         * Labeled non-interactive zero-knowledge proof of knowledge in the
         * random oracle model.
         */
        class ZKPoK {
            /**
             * Indicates if pre-computation requires the
             * instance.
             * @returns True or false depending on if pre-computation requires the
             * instance or not.
             */
            precomputeRequiresInstance() {
                return false;
            }
            /* eslint-enable no-unused-vars */
            /**
             * Computes a proof.
             *
             * @param label - Label as an array of bytes or byte tree.
             * @param instance - Instance.
             * @param witness - Witness of instance belonging to the right language.
             * @param hashfunction - Hash function used to implement the random
             * oracle.
             * @param randomSource - Source of randomness.
             * @param statDist - Statistical distance from the uniform distribution
             * assuming a perfect random source.
             * @returns Proof in the form of a byte array.
             */
            prove(label, instance, witness, hashfunction, randomSource, statDist) {
                const precomputed = this.precompute(randomSource, statDist, instance);
                return this.completeProof(precomputed, label, instance, witness, hashfunction, randomSource, statDist);
            }
        }
        crypto.ZKPoK = ZKPoK;
        /* eslint-disable no-unused-vars */
        /**
         * A public-coin three-message special sound and special
         * zero-knowledge protocol, i.e., a Sigma proof, made non-interactive
         * in the random oracle model using the Fiat-Shamir heuristic.
         *
         * <p>
         *
         * Recall that public-coin means that the verifier's challenge message
         * is simply a random bit string and that the verdict is computed from
         * the transcript. Special soundness means that given two accepting
         * transcripts (A, v, k) and (A, v', k') such that v != v' a witness w
         * can be computed such that (x, w) is in the NP relation (this is why
         * it is a proof of knowledge). Special zero-knowledge means that
         * there is an efficient simulator Sim such that for every fixed
         * verifier challenge v: Sim(x, v) is identically distributed to a
         * transcript of an execution on x with the verifier challenge v.
         *
         * <p>
         *
         * The Fiat-Shamir heuristic can be applied, since the protocol is
         * public-coin. We use a systematic approach to generate a proper
         * prefix.
         */
        class SigmaProof extends ZKPoK {
            /**
             * Packs a label, instance, and a commitment
             * represented as a byte tree into a single byte tree.
             */
            pack(label, instance, commitmentByteTree) {
                const lbt = ByteTree.asByteTree(label);
                const ibt = this.instanceToByteTree(instance);
                return new ByteTree([lbt, ibt, commitmentByteTree]);
            }
            /* eslint-enable no-unused-vars */
            completeProof(precomputed, label, instance, witness, hashfunction, randomSource, statDist) {
                const pair = this.commit(precomputed, instance, witness, randomSource, statDist);
                const updatedPrecomputed = pair[0];
                const commitment = pair[1];
                // Represent the commitment as a byte tree.
                const cbt = this.commitmentToByteTree(commitment);
                // Compute the challenge as hash value of the label, instance,
                // and commitment.
                const bt = this.pack(label, instance, cbt);
                const challenge = this.challenge([bt, hashfunction]);
                // Compute the reply and represent it as a byte tree.
                const reply = this.reply(updatedPrecomputed, witness, challenge);
                const rbt = this.replyToByteTree(reply);
                // Return a single byte tree.
                return new ByteTree([cbt, rbt]);
            }
            verify(label, instance, hashfunction, proof) {
                // A valid proof has two sub-byte trees.
                if (proof.isLeaf()) {
                    return false;
                } else if (proof.value.length == 2) {
                    // We have one subtree for the commitment and one for the
                    // reply.
                    const cbt = proof.value[0];
                    const rbt = proof.value[1];
                    // The commitment must be correctly formed.
                    let commitment;
                    try {
                        commitment = this.byteTreeToCommitment(cbt);
                    } catch (err) {
                        return false;
                    }
                    // Compute the challenge as hash value of the label,
                    // instance, and commitment.
                    const bt = this.pack(label, instance, cbt);
                    const challenge = this.challenge([bt, hashfunction]);
                    // The reply must be correctly formed.
                    let reply;
                    try {
                        reply = this.byteTreeToReply(rbt);
                    } catch (err) {
                        return false;
                    }
                    // If we can parse the proof, then we verify that the
                    // instance, commitment, challenge, and reply is an
                    // accepting transcript of the Sigma proof.
                    return this.check(instance, commitment, challenge, reply);
                } else {
                    return false;
                }
            }
        }
        crypto.SigmaProof = SigmaProof;
        /**
         * Parallel execution of Sigma proofs with identical
         * challenges from the same challenge space, but different instances
         * and witnesses. This exploits the special zero knowledge property.
         *
         * @param sigmaProofs - Component Sigma proofs.
         */
        class SigmaProofPara extends SigmaProof {
            constructor(sigmaProofs) {
                super();
                this.sigmaProofs = sigmaProofs;
            }
            randomnessByteLength(statDist) {
                let byteLength = 0;
                for (let i = 0; i < this.sigmaProofs.length; i++) {
                    byteLength += this.sigmaProofs[i].randomnessByteLength(statDist);
                }
                return byteLength;
            }
            instanceToByteTree(instance) {
                const bta = [];
                for (let i = 0; i < instance.length; i++) {
                    bta[i] = this.sigmaProofs[i].instanceToByteTree(instance[i]);
                }
                return new ByteTree(bta);
            }
            precompute(randomSource, statDist) {
                const hint = [];
                const commitment = [];
                for (let i = 0; i < this.sigmaProofs.length; i++) {
                    const hintAndCommitment = this.sigmaProofs[i].precompute(randomSource, statDist);
                    hint[i] = hintAndCommitment[0];
                    commitment[i] = hintAndCommitment[1];
                }
                return [hint, commitment];
            }
            precomputedToByteTree(rv) {
                const bts = [];
                for (let i = 0; i < this.sigmaProofs.length; i++) {
                    const r = rv[0][i];
                    const v = rv[1][i];
                    bts[i] = this.sigmaProofs[i].precomputedToByteTree([r, v]);
                }
                return new ByteTree(bts);
            }
            byteTreeToPrecomputed(bt) {
                const r = [];
                const v = [];
                for (let i = 0; i < this.sigmaProofs.length; i++) {
                    const tbt = bt.value[i];
                    [r[i], v[i]] = this.sigmaProofs[i].byteTreeToPrecomputed(tbt);
                }
                return [r, v];
            }
            commit(precomputed) {
                return precomputed;
            }
            commitmentToByteTree(commitment) {
                const bta = [];
                for (let i = 0; i < commitment.length; i++) {
                    bta[i] = this.sigmaProofs[i].commitmentToByteTree(commitment[i]);
                }
                return new ByteTree(bta);
            }
            byteTreeToCommitment(byteTree) {
                if (byteTree.isLeaf()) {
                    throw Error("Byte tree is a leaf!");
                } else if (byteTree.value.length === this.sigmaProofs.length) {
                    const byteTrees = byteTree.value;
                    const commitment = [];
                    for (let i = 0; i < this.sigmaProofs.length; i++) {
                        commitment[i] =
                            this.sigmaProofs[i].byteTreeToCommitment(byteTrees[i]);
                    }
                    return commitment;
                } else {
                    throw Error("Byte tree has wrong number of children! (" +
                        byteTree.value.length + " != " +
                        this.sigmaProofs.length + ")");
                }
            }
            challenge(kind) {
                // Use first instance to generate challenge, since challenge
                // spaces are identical.
                return this.sigmaProofs[0].challenge(kind);
            }
            reply(precomputed, witness, challenge) {
                const reply = [];
                for (let i = 0; i < this.sigmaProofs.length; i++) {
                    reply[i] = this.sigmaProofs[i].reply(precomputed[i], witness[i], challenge);
                }
                return reply;
            }
            replyToByteTree(reply) {
                const bta = [];
                for (let i = 0; i < reply.length; i++) {
                    bta[i] = this.sigmaProofs[i].replyToByteTree(reply[i]);
                }
                return new ByteTree(bta);
            }
            byteTreeToReply(byteTree) {
                if (byteTree.isLeaf()) {
                    throw Error("Byte tree is a leaf!");
                } else if (byteTree.value.length === this.sigmaProofs.length) {
                    const byteTrees = byteTree.value;
                    const reply = [];
                    for (let i = 0; i < this.sigmaProofs.length; i++) {
                        reply[i] = this.sigmaProofs[i].byteTreeToReply(byteTrees[i]);
                    }
                    return reply;
                } else {
                    throw Error("Byte tree has wrong number of children! (" +
                        byteTree.value.length + " != " +
                        this.sigmaProofs.length + ")");
                }
            }
            check(instance, commitment, challenge, reply) {
                for (let i = 0; i < this.sigmaProofs.length; i++) {
                    if (!this.sigmaProofs[i].check(instance[i], commitment[i], challenge, reply[i])) {
                        return false;
                    }
                }
                return true;
            }
            simulate(instance, challenge, randomSource, statDist) {
                const commitment = [];
                const reply = [];
                for (let i = 0; i < this.sigmaProofs.length; i++) {
                    const commitmentAndReply = this.sigmaProofs[i].simulate(instance[i], challenge, randomSource, statDist);
                    commitment[i] = commitmentAndReply[0];
                    reply[i] = commitmentAndReply[1];
                }
                return [commitment, reply];
            }
        }
        crypto.SigmaProofPara = SigmaProofPara;
        /**
         * This allows combining proofs of multiple properties
         * about the same instance. All proofs must have the same challenge
         * space.
         *
         * @param sigmaProofs - Component Sigma proofs.
         */
        class SigmaProofAnd extends SigmaProofPara {
            constructor(sigmaProofs) {
                super(sigmaProofs);
            }
            expand(instance) {
                return fill(instance, this.sigmaProofs.length);
            }
            verify(label, instance, hashfunction, proof) {
                return super.verify(label, this.expand(instance[0]), hashfunction, proof);
            }
            simulate(instance, challenge, randomSource, statDist) {
                return super.simulate(this.expand(instance[0]), challenge, randomSource, statDist);
            }
            completeProof(precomputed, label, instance, witness, hashfunction, randomSource, statDist) {
                return super.completeProof(precomputed, label, this.expand(instance[0]), witness, hashfunction, randomSource, statDist);
            }
        }
        crypto.SigmaProofAnd = SigmaProofAnd;
        /**
         * Sigma proof of a pre-image of a homomorphism from a
         * ring to a group using a generalized Schnorr proof. More precisely,
         * if Hom : R -> G is a homomorphism, where R is a product ring of a
         * finite field Z/qZ of order q, and every non-trivial element in G
         * has order q, then the protocol is defined as follows on common
         * input x and private input w such that (x, w) is in the NP relation.
         *
         * <ol>
         *
         * <li> Prover chooses a in R randomly and computes A = Hom(a).
         *
         * <li> Verifier chooses a random challenge v in Z/qZ.
         *
         * <li> Prover computes a reply k = w * v + a in R.
         *
         * <li> Verifier accepts if and only if x^v * A = Hom(k), where the
         *      product is taken in G.
         *
         * </ol>
         *
         * @param homomorphism - Underlying homomorphism.
         */
        class SchnorrProof extends SigmaProof {
            constructor(homomorphism) {
                super();
                this.homomorphism = homomorphism;
            }
            randomnessByteLength(statDist) {
                return this.homomorphism.domain.randomElementByteLength(statDist);
            }
            instanceToByteTree(instance) {
                return instance.toByteTree();
            }
            precompute(randomSource, statDist) {
                // A = Hom(a) for random a.
                const a = this.homomorphism.domain.randomElement(randomSource, statDist);
                const A = this.homomorphism.eva(a);
                return [a, A];
            }
            precomputedToByteTree(aA) {
                return new ByteTree([aA[0].toByteTree(), aA[1].toByteTree()]);
            }
            byteTreeToPrecomputed(bt) {
                return [this.homomorphism.domain.toElement(bt.value[0]),
                    this.homomorphism.range.toElement(bt.value[1])
                ];
            }
            commit(precomputed) {
                return precomputed;
            }
            commitmentToByteTree(commitment) {
                return commitment.toByteTree();
            }
            byteTreeToCommitment(byteTree) {
                return this.homomorphism.range.toElement(byteTree);
            }
            challenge(kind) {
                const pField = this.homomorphism.domain.getPField();
                if (ofClass(kind[0], ByteTree)) {
                    const byteTree = kind[0];
                    const hashfunction = kind[1];
                    const digest = hashfunction.hash(byteTree.toByteArray());
                    return pField.toElementFromByteArray(digest);
                } else {
                    const randomSource = kind[0];
                    const statDist = kind[1];
                    return pField.randomElement(randomSource, statDist);
                }
            }
            reply(precomputed, witness, challenge) {
                // k = w * v + a
                return witness.mul(challenge).add(precomputed);
            }
            replyToByteTree(reply) {
                return reply.toByteTree();
            }
            byteTreeToReply(byteTree) {
                return this.homomorphism.domain.toElement(byteTree);
            }
            check(instance, commitment, challenge, reply) {
                // Check if x^v * A = Hom(k).
                const ls = instance.exp(challenge).mul(commitment);
                const rs = this.homomorphism.eva(reply);
                return ls.equals(rs);
            }
            simulate(instance, challenge, randomSource, statDist) {
                // A = Hom(k) / x^v, for a randomly chosen random k.
                const k = this.homomorphism.domain.randomElement(randomSource, statDist);
                const A = this.homomorphism.eva(k).mul(instance.exp(challenge).inv());
                return [A, k];
            }
        }
        crypto.SchnorrProof = SchnorrProof;
        /**
         * Adapter for {@link ZKPoKWriteIn}.
         */
        class ZKPoKWriteInAdapter {
            getZKPoK(publicKey) {
                return new ZKPoKWriteIn(publicKey);
            }
        }
        crypto.ZKPoKWriteInAdapter = ZKPoKWriteInAdapter;
        /**
         * Zero-knowledge proof needed to implement the Naor-Yung
         * cryptosystem.
         */
        class ZKPoKWriteIn extends ZKPoK {
            constructor(publicKey) {
                super();
                const domain = publicKey.project(1).pGroup.pRing;
                const basis = publicKey.project(0);
                const expHom = new ExpHom(domain, basis);
                this.sp = new SchnorrProof(expHom);
            }
            randomnessByteLength(statDist) {
                return this.sp.randomnessByteLength(statDist);
            }
            precompute(randomSource, statDist) {
                return this.sp.precompute(randomSource, statDist);
            }
            precomputedToByteTree(aA) {
                return this.sp.precomputedToByteTree(aA);
            }
            byteTreeToPrecomputed(bt) {
                return this.sp.byteTreeToPrecomputed(bt);
            }
            completeProof(precomputed, label, instance, witness, hashfunction, randomSource, statDist) {
                const completeLabel = ZKPoKWriteIn.makeLabel(label, instance);
                return this.sp.completeProof(precomputed, completeLabel, instance.project(0), witness, hashfunction, randomSource, statDist);
            }
            verify(label, instance, hashfunction, proof) {
                const completeLabel = ZKPoKWriteIn.makeLabel(label, instance);
                return this.sp.verify(completeLabel, instance.project(0), hashfunction, proof);
            }
            /**
             * Combines an arbitrary label with parts of the instance
             * not included as input by the ZKPoK itself.
             *
             * @param label - Label in the form of a byte array or byte tree.
             * @param instance - Complete instance.
             * @returns Combined label.
             */
            static makeLabel(label, instance) {
                const lbt = ByteTree.asByteTree(label);
                const ebt = instance.project(1).toByteTree();
                const bt = new ByteTree([lbt, ebt]);
                return bt.toByteArray();
            }
        }
        crypto.ZKPoKWriteIn = ZKPoKWriteIn;
        /**
         * Splits a product group element consisting of two parts into its two
         * parts.
         *
         * @param pair - Group element to be split.
         * @returns Its two parts.
         */
        function splitPair(pair) {
            if (pair.pGroup.getWidth() === 2) {
                return [pair.project(0), pair.project(1)];
            } else {
                throw Error("Public key has more than two factors!");
            }
        }
        /**
         * The El Gamal cryptosystem implemented on top of {@link
         * arithm.PGroup}. This is a generalized implementation in several
         * ways and eliminates the complexity that plagues other
         * implementations by proper abstractions.
         *
         * <p>
         *
         * The first generalization allows us to use multiple El Gamal public
         * keys in parallel. The second allows us to define and implement the
         * Naor-Yung cryptosystem directly from the El Gamal cryptosystem and
         * a proof equal exponents (see {@link ElGamalZKPoK}). The third
         * generalizes the cryptosystem to any width of plaintexts, i.e.,
         * lists of plaintexts, or equivalently elements of product groups.
         *
         * <ul>
         *
         * <li> The first generalization is captured by letting the underlying
         *      group G be of the form G = H^k, where H is a group of prime
         *      order q and k > 0 is the key width, and the private key is
         *      contained in the ring of exponents R = (Z/qZ)^k of G, where
         *      Z/qZ is the field of prime order q.
         *
         * <li> In the standard cryptosystem the private key is an element x
         *      of R, and the public key has the form (g, y), where g is an
         *      element of G and y = g^x. In the second generalization we
         *      instead allow the public key to be an element ((g, h), y) of
         *      (G x G) x G, but still define y = g^x with x in R. Here h can
         *      be thought of as h = y^z for a random z in R.
         *   <p>
         *      The standard cryptosystem defines encryption of a message m in
         *      G as Enc((g, y), m, r) = (g^r, y^r * m), where r is randomly
         *      chosen in R. We generalize encryption by simply setting
         *      Enc(((g, h), y), m, r) = ((g^r, h^r), y^r * m). Note that the
         *      same exponent r is used for all three exponentiations and that
         *      it resides in R.
         *   <p>
         *      The standard cryptosystem defines decryption of a ciphertext
         *      (u, v) by Dec(x, (u, v)) = v / u^x. In the generalized version
         *      a decryption is defined by Dec(x, ((u, a), v)) = v / u^x.
         *
         * <li> We generalize the cryptosystem to allow encryption of
         *      plaintexts m of width w contained in G' = G^w, or equivalently
         *      lists of plaintexts in G. A simple way to accomplish this with
         *      a proper implementation of groups (see {@link arithm.PGroup})
         *      is to simply widen public and secret keys.
         *
         *      <ol>
         *
         *      <li> The original secret key x is replaced by x' = (x, x,..., x)
         *           in R' = R^w.
         *
         *      <li> A public key (g, y) in G x G is replaced by (g', y'),
         *           where y' = (g, g,..., g) and y' = (y, y,..., y) are
         *           elements in G'. Thus, the new public key is contained in
         *           G' x G'.
         *
         *      <li> A public key ((g, h), y) in (G x G) x G is replaced by a
         *           wider public key ((g', h'), y'), where g', and y' are
         *           defined as above and h' is defined accordingly. Thus, the
         *           new public key is contained in (G' x G') x G'.
         *
         *      </ol>
         *
         * </ul>
         *
         * @param standard - Determines if the standard or variant El Gamal
         * cryptosystem is used.
         * @param pGroup - Group G over which the cryptosystem is defined.
         * @param random - Source of randomness.
         * @param statDist - Statistical distance from the uniform distribution
         * assuming that the output of the instance of the random source is
         * perfect.
         */
        class ElGamal {
            constructor(standard, pGroup, randomSource, statDist) {
                this.standard = standard;
                this.pGroup = pGroup;
                this.randomSource = randomSource;
                this.statDist = statDist;
                if (this.standard) {
                    this.ghPGroup = pGroup;
                } else {
                    this.ghPGroup = new PPGroup([pGroup, 2]);
                }
                this.pkPGroup = new PPGroup([this.ghPGroup, this.pGroup]);
            }
            /**
             * Computes the number of random bytes needed to
             * encrypt using a given public key. Note that this depends on the
             * width of the public key and not only on the group G, and
             * associated ring, over which the cryptosystem is defined.
             * @returns Number of random bytes needed to encrypt.
             */
            randomnessByteLength(publicKey) {
                const y = publicKey.project(1);
                return y.pGroup.pRing.randomElementByteLength(this.statDist);
            }
            /**
             * Generates a key pair of the El Gamal cryptosystem.
             * @returns Pair [pk, sk] such that pk is a public key in G x G or in
             * (G x G) x G depending on if the standard or variant scheme is used,
             * and sk is the corresponding private key contained in R.
             */
            gen() {
                const pGroup = this.pGroup;
                // Generate secret key.
                const sk = pGroup.pRing.randomElement(this.randomSource, this.statDist);
                let gh;
                // A standard public key uses the standard generator
                // associated with the group.
                if (this.standard) {
                    gh = pGroup.getg();
                    // Variant public key uses an additional generator which forms
                    // a generator, under exponentiation, of a product group.
                } else {
                    // Generate additional independent generator. This can be
                    // exploited in a proof of security as a second way to
                    // decrypt and establish CCA2 security despite that we do
                    // not exponentiate with the secret key below.
                    const r = pGroup.pRing.randomElement(this.randomSource, this.statDist);
                    const h = pGroup.getg().exp(r);
                    // Form a single generator for the product group.
                    gh = this.ghPGroup.prod([pGroup.getg(), h]);
                }
                // Compute public key obliviously.
                const pk = this.pkPGroup.prod([gh, pGroup.getg().exp(sk)]);
                return [pk, sk];
            }
            /**
             * Pre-computation for encrypting a message using {@link
             * ElGamal.completeEncrypt}.
             *
             * @param publicKey - Public key of the form (g', y'), or ((g', h'), y')
             * depending on if the standard or variant scheme is used.
             * @param random - Randomness r in R' used for encryption, a
             * random source, or empty in which case it is generated.
             * @returns Triple of the form [r, u, v] or [r, (u, a), v], where u =
             * (g')^r, a = (h')^r, and v = (y')^r, depending on if the standard or
             * variant scheme is used.
             */
            precomputeEncrypt(publicKey, random) {
                const [gh, y] = splitPair(publicKey);
                let r;
                if (ofSubclass(random, PRingElement)) {
                    r = random;
                } else {
                    let rs;
                    if (typeof random === "undefined") {
                        rs = this.randomSource;
                    } else {
                        rs = random;
                    }
                    // Note that we choose r in R' and not the ring of
                    // exponents of the group in which gh is contained.
                    r = y.pGroup.pRing.randomElement(rs, this.statDist);
                }
                const u = gh.exp(r);
                const v = y.exp(r);
                return [r, u, v];
            }
            /**
             * Completes the encryption of a message with the El
             * Gamal cryptosystem.
             *
             * @param publicKey - Public key of the form (g', y'), or ((g', h'), y')
             * depending on if the standard or variant scheme is used.
             * @param ruv - Triple of the form [r, u, v] or [r, (u, a), v] as
             * output by {@link ElGamal.precomputeEncrypt}, depending on if
             * the standard or variant scheme is used.
             * @param message - Message in G' to encrypt (must match group used in
             * pre-computation).
             * @returns Ciphertext of the form (u, v * message) or ((u, a), v *
             * message), depending on if the standard or variant scheme is used.
             */
            completeEncrypt(publicKey, ruv, message) {
                return publicKey.pGroup.prod([ruv[1], ruv[2].mul(message)]);
            }
            /**
             * Encrypts a message with the El Gamal cryptosystem.
             *
             * @param publicKey - Public key.
             * @param message - Message in G' to encrypt.
             * @param random - Randomness r in R' used for decryption. If this is
             * empty, then it is generated.
             * @returns Ciphertext of the form output by {@link
             * ElGamal.completeEncrypt}.
             */
            encrypt(publicKey, message, random) {
                const ruv = this.precomputeEncrypt(publicKey, random);
                return this.completeEncrypt(publicKey, ruv, message);
            }
            /**
             * Decrypts an El Gamal ciphertext.
             * @param sk - Private key x' contained in R'.
             * @param ciphertext - Ciphertext (u, v) in G' x G', or ((u, a), v) in
             * (G' x G') x G') to be decrypted, depending on if the standard or
             * variant scheme is used.
             * @returns Plaintext computed as v / u^(x').
             */
            decrypt(sk, ciphertext) {
                const ua = ciphertext.project(0);
                const v = ciphertext.project(1);
                let u;
                // Use ua directly for standard ciphertexts and only first
                // component otherwise.
                if (this.standard) {
                    u = ua;
                } else {
                    u = ua.project(0);
                }
                return v.mul(u.exp(sk.neg()));
            }
            /**
             * Widens a public key such that an element from a
             * product group of the underlying group can be encrypted.
             *
             * @param publicKey - Original public key.
             * @param width - Width of wider public key.
             * @returns Public key with the same key width, but with the given
             * width.
             */
            widePublicKey(publicKey, width) {
                if (width > 1) {
                    /* eslint-disable prefer-const */
                    let gh;
                    let y;
                    [gh, y] = splitPair(publicKey);
                    /* eslint-enable prefer-const */
                    // Widen first component.
                    let wghGroup;
                    let wgh;
                    // Widen second component.
                    const wyGroup = new PPGroup([this.pGroup, width]);
                    const wy = wyGroup.prod(y);
                    if (this.standard) {
                        wghGroup = wyGroup;
                        wgh = wghGroup.prod(gh);
                    } else {
                        // Extract components
                        /* eslint-disable prefer-const */
                        let g;
                        let h;
                        [g, h] = splitPair(gh);
                        /* eslint-enable prefer-const */
                        // Widen each part.
                        const wg = wyGroup.prod(g);
                        const wh = wyGroup.prod(h);
                        // Combine the parts.
                        wghGroup = new PPGroup([wyGroup, 2]);
                        wgh = wghGroup.prod([wg, wh]);
                    }
                    // Return the complete widened public key.
                    const wpkGroup = new PPGroup([wghGroup, wyGroup]);
                    return wpkGroup.prod([wgh, wy]);
                } else {
                    return publicKey;
                }
            }
            /**
             * Widens a private key by duplication such that a
             * ciphertext resulting from the encryption with the
             * correspondingly widened public key can be decrypted.
             *
             * @param sk - Original private key.
             * @param width - Width of wider public key.
             * @returns Public key with the same key width, but with the given
             * width.
             */
            widePrivateKey(sk, width) {
                if (width > 1) {
                    const wskRing = new PPRing([sk.pRing, width]);
                    return wskRing.prod(sk);
                } else {
                    return sk;
                }
            }
            /**
             * Marshals a public key as the Verificatum Mix-Net, including
             * description of group used.
             *
             * @param pk - Public key.
             * @returns Byte tree representation of full public key.
             */
            static marshalPK(pk) {
                if (pk.values.length == 2) {
                    const pGroup = pk.project(0).pGroup;
                    const btg = pGroup.marshal();
                    const btpk = pk.toByteTree();
                    return new ByteTree([btg, btpk]);
                } else {
                    throw Error("Key does not have two elements! (" +
                        pk.values.length + ")");
                }
            }
            /**
             * Unmarshals a full public key as generated by the Verificatum
             * Mix-Net, including the embedded description of the group used.
             *
             * @param byteTree - Byte tree representation of a full public
             * key.
             * @returns Public key represented by the input.
             */
            static unmarshalPK(byteTree) {
                if (byteTree.isLeaf() || byteTree.value.length != 2) {
                    throw Error("Byte tree does not have two children! (" +
                        byteTree.value.length + ")");
                } else {
                    const btg = byteTree.value[0];
                    const btpk = byteTree.value[1];
                    const pGroup = PGroupFactory.unmarshalPGroup(btg);
                    const pPGroup = new PPGroup([pGroup, 2]);
                    return pPGroup.toElement(btpk);
                }
            }
        }
        crypto.ElGamal = ElGamal;
        /**
         * Adapter for {@link ElGamalZKPoK} that creates {@link ZKPoK} that
         * imposes restrictions on plaintexts and ciphertexts.
         */
        class ElGamalZKPoKAdapter {}
        crypto.ElGamalZKPoKAdapter = ElGamalZKPoKAdapter;
        /**
         * Generalized El Gamal cryptosystem with parameterized zero-knowledge
         * proof of knowledge. This supports wider keys as explained in {@link
         * ElGamal}.
         *
         * <p>
         *
         * Restrictions on the ciphertexts and encrypted plaintexts are
         * readily expressed by forming an application specific ZKPoK and
         * setting the adapter variable.
         *
         * @param standard - Determines if the standard or variant El Gamal
         * cryptosystem is used.
         * @param pGroup - Group G over which the cryptosystem is defined. This
         * can be a product group if the key width is greater than one.
         * @param adapter - Adapter for instantiating ZKPoKs.
         * @param hashfunction - Hash function used to implement the Fiat-Shamir
         * heuristic in ZKPoKs.
         * @param randomSource - Source of randomness.
         * @param statDist - Statistical distance from the uniform distribution
         * assuming that the output of the instance of the random source is
         * perfect.
         */
        class ElGamalZKPoK {
            constructor(standard, pGroup, adapter, hashfunction, randomSource, statDist) {
                this.eg = new ElGamal(standard, pGroup, randomSource, statDist);
                this.adapter = adapter;
                this.hashfunction = hashfunction;
            }
            /**
             * Generates a key pair over the given group.
             * @returns Pair [pk, sk] such that pk is a public key in G x G or in
             * (G x G) x G depending on if the standard or variant scheme is used,
             * and sk is the corresponding private key contained in R.
             */
            gen() {
                return this.eg.gen();
            }
            /**
             * Pre-computation for encrypting a message using {@link
             * ElGamalZKPoK.completeEncrypt}.
             *
             * @param publicKey - Public key output by {@link
             * ElGamalZKPoK.gen}.
             * @returns Precomputed values represented as a byte tree.
             */
            precomputeEncrypt(publicKey, random) {
                const ruv = this.eg.precomputeEncrypt(publicKey, random);
                const ruvbt = new ByteTree([ruv[0].toByteTree(),
                    ruv[1].toByteTree(),
                    ruv[2].toByteTree()
                ]);
                const zkpok = this.adapter.getZKPoK(publicKey);
                let rs;
                if (typeof random === "undefined") {
                    rs = this.eg.randomSource;
                } else {
                    rs = random;
                }
                const prebt = zkpok.precomputedToByteTree(zkpok.precompute(rs, this.eg.statDist));
                return new ByteTree([ruvbt, prebt]);
            }
            /**
             * Completes the encryption.
             *
             * @param label - Label used for encryption.
             * @param publicKey - Public key.
             * @param precomputed - Output from {@link
             * ElGamalZKPoK.precomputeEncrypt}.
             * @param message - Message in G to encrypt.
             * @returns Ciphertext in the form of a byte tree.
             */
            completeEncrypt(label, publicKey, precomputed, message) {
                // Unpack precomputed values for El Gamal.
                const ruvbt = precomputed.value[0];
                const uPGroup = publicKey.project(0).pGroup;
                const vPGroup = publicKey.project(1).pGroup;
                const r = vPGroup.pRing.toElement(ruvbt.value[0]);
                const u = uPGroup.toElement(ruvbt.value[1]);
                const v = vPGroup.toElement(ruvbt.value[2]);
                // Complete El Gamal encryption.
                const egc = this.eg.completeEncrypt(publicKey, [r, u, v], message);
                // Unpack precomputed values for zero knowledge proof.
                const prebt = precomputed.value[1];
                const zkpok = this.adapter.getZKPoK(publicKey);
                const proof = zkpok.completeProof(zkpok.byteTreeToPrecomputed(prebt), label, egc, r, this.hashfunction, this.eg.randomSource, this.eg.statDist);
                return new ByteTree([egc.toByteTree(), proof]);
            }
            /**
             * Encrypts a message.
             *
             * @param label - Label used for encryption.
             * @param publicKey - Public key.
             * @param message - Message in G' to encrypt.
             * @returns Ciphertext of the form of a byte tree.
             */
            encrypt(label, publicKey, message) {
                const precomputed = this.precomputeEncrypt(publicKey);
                return this.completeEncrypt(label, publicKey, precomputed, message);
            }
            /**
             * Decrypts an El Gamal ciphertext.
             *
             * @param label - Label used for decryption.
             * @param privateKey - Private key in R'.
             * @param ciphertext - Ciphertext in the form of a byte tree.
             * @returns Plaintext or empty string to indicate that the
             * ciphertext was invalid.
             */
            decrypt(label, publicKey, privateKey, ciphertext) {
                if (ciphertext.isLeaf()) {
                    return "parse leaf error";
                } else {
                    if (ciphertext.value.length === 2) {
                        // Parse ElGamal ciphertext from byte tree.
                        const btElGamal = ciphertext.value[0];
                        let ciphertextElement;
                        try {
                            ciphertextElement =
                                publicKey.pGroup.toElement(btElGamal);
                        } catch (err) {
                            return "parse elgamal error";
                        }
                        // Verify proof.
                        const proof = ciphertext.value[1];
                        const zkpok = this.adapter.getZKPoK(publicKey);
                        if (zkpok.verify(label, ciphertextElement, this.hashfunction, proof)) {
                            // Decrypt El Gamal ciphertext is the proof is valid.
                            return this.eg.decrypt(privateKey, ciphertextElement);
                        } else {
                            return "proof error";
                        }
                    } else {
                        return "parse length error";
                    }
                }
            }
            widePublicKey(publicKey, width) {
                return this.eg.widePublicKey(publicKey, width);
            }
            widePrivateKey(privateKey, width) {
                return this.eg.widePrivateKey(privateKey, width);
            }
        }
        crypto.ElGamalZKPoK = ElGamalZKPoK;
        /**
         * Generalized Naor-Yung cryptosystem, i.e., a
         * generalized El Gamal with zero-knowledge proof of knowledge of the
         * plaintext without any restrictions on the plaintext.
         * @param standard - Determines if the standard or variant El Gamal
         * cryptosystem is used.
         * @param pGroup - Group G over which the cryptosystem is defined.
         * @param hashfunction - Hash function used to implement the Fiat-Shamir
         * heuristic in ZKPoKs.
         * @param randomSource - Source of randomness.
         * @param statDist - Statistical distance from the uniform distribution
         * assuming that the output of the instance of the random source is
         * perfect.
         */
        class ElGamalZKPoKWriteIn extends ElGamalZKPoK {
            constructor(standard, pGroup, hashfunction, randomSource, statDist) {
                super(standard, pGroup, new ZKPoKWriteInAdapter(), hashfunction, randomSource, statDist);
            }
        }
        crypto.ElGamalZKPoKWriteIn = ElGamalZKPoKWriteIn;
        /**
         * Utility class that simplifies using cryptosystems correctly.
         */
        class ElGamalZKPoKFactory {
            static getCryptosystem(pGroup, zkpokbt, randomSource, statDist) {
                if (zkpokbt.isLeaf()) {
                    return new ElGamalZKPoKWriteIn(true, pGroup, new SHA256(), randomSource, statDist);
                } else {
                    throw Error("Unknown zero knowledge proof encoding!");
                }
            }
        }
        crypto.ElGamalZKPoKFactory = ElGamalZKPoKFactory;
        /**
         * Utility class for simplifying configuration and optimizing the use
         * of cryptosystems by users.
         */
        class ElGamalZKPoKComp {
            /**
             * Constructs a pre-computer for the given public key and variant
             * of the zero knowledge proof encoded.
             *
             * @param marshalled - Representation of a byte tree with two
             * children: (1) a full generalized El Gamal public key including
             * the group used using the format of the Verificatum Mix-Net
             * (VMN), and (2) an encoding of the zero knowledge proof used to
             * prove knowledge of the plaintext as well as possibly restrict
             * the plaintext to a subset, i.e., one of several options in an
             * election or free text of bounded length in the simplest case.
             * @param randomness - A random seed consisting of exactly 32
             * bytes, its hexadecimal representation as a string, or a
             * cryptographically strong source of randomness.
             *
             * @throws Error if any input is not correctly formatted.
             */
            constructor(marshalled, randomness) {
                // This parameter affects how far statistically from the uniform
                // distribution we would sample, e.g., field elements, assuming
                // that the source of randomness used was a uniformly distributed
                // bit string.
                //
                // This is a conservative choice, but important to keep fixed for
                // auditing purposes since all values must be derived exactly the
                // same way by an independently implemented client.
                this.statDist = 50;
                let byteArray;
                if (typeof marshalled === "string") {
                    // Strip comment if present.
                    const start = marshalled.indexOf("::");
                    if (start > 0) {
                        marshalled = marshalled.slice(start + 2);
                    }
                    if (isHexString(marshalled)) {
                        byteArray = hexToByteArray(marshalled);
                    } else {
                        throw Error("Marshalled public key is not hexadecimal string!");
                    }
                } else {
                    byteArray = marshalled;
                }
                // This may throw errors.
                const bt = ByteTree.readByteTreeFromByteArray(byteArray);
                let pkbt;
                let zkpokbt;
                if (bt.isLeaf()) {
                    throw Error("Byte tree is a leaf!");
                } else if (bt.value.length == 2) {
                    pkbt = bt.value[0];
                    zkpokbt = bt.value[1];
                } else {
                    throw Error("Byte tree does not have two children! " +
                        "(${bt.value.length})");
                }
                // Recover the public key and its underlying group.
                this.publicKey = ElGamal.unmarshalPK(pkbt);
                this.pGroup = this.publicKey.pGroup.project(0);
                // Set up a source of randomness from which we sample seeds
                // for generating the randomness used to precompute for
                // encryption.
                if (ofSubclass(randomness, RandomSource)) {
                    this.randomSource = randomness;
                } else {
                    const randomSource = new SHA256PRG();
                    let seed;
                    if (Array.isArray(randomness)) {
                        seed = randomness;
                    } else {
                        const hex = randomness;
                        if (isHexString(hex)) {
                            seed = hexToByteArray(hex);
                        } else {
                            throw Error("Seed string is not hexadecimal!");
                        }
                    }
                    if (seed.length == randomSource.seedLength) {
                        randomSource.setSeed(seed);
                        this.randomSource = randomSource;
                    } else {
                        throw Error("Wrong seed length! (${seed.length} " +
                            "!= ${this.randomSource.seedLength})");
                    }
                }
                // Although we pass the random source to the cryptosystem
                // here, it is only used to potentially verify parameters
                // probabilistically and not for precomputation. We always
                // generate a separate seed and use a PRG for each ciphertext
                // to allow auditing directly from the seed.
                this.cryptosystem =
                    ElGamalZKPoKFactory.getCryptosystem(this.pGroup, zkpokbt, this.randomSource, this.statDist);
                // This PRG is re-seeded with a fresh seed for each precomputation.
                this.prg = new SHA256PRG();
            }
            /**
             * Precompute for encryption and return the precomputed values. We
             * effectively encrypt using the output of SHA256 in counter mode
             * using a seed drawn from the cryptographically strong random
             * source of this instance. This allows the user to audit their
             * encryption by independently re-implementing encryption.
             *
             * @returns Seed and precomputed values as a pair.
             */
            precompute() {
                return new Promise((resolve, reject) => {
                    // We generate a seed from the cryptographically strong
                    // random source and seed our PRG with it to get a random
                    // source used to generate the randomness used for one
                    // specific encryption.
                    const seed = this.randomSource.getBytes(this.prg.seedLength);
                    this.prg.setSeed(seed);
                    // Perform pre-computation.
                    const precomputed = this.cryptosystem.precomputeEncrypt(this.publicKey, this.prg);
                    // Return seed and pre-computed values as a byte tree.
                    resolve(new ByteTree([new ByteTree(seed), precomputed]));
                });
            }
        }
        crypto.ElGamalZKPoKComp = ElGamalZKPoKComp;
        /**
         * Utility class that simplifies using cryptosystems correctly.
         */
        class ElGamalZKPoKClient {
            constructor(first, randomSource) {
                if (ofSubclass(first, ElGamalZKPoKComp)) {
                    this.computer = first;
                } else if (typeof randomSource != "undefined") {
                    this.computer =
                        new ElGamalZKPoKComp(first, randomSource);
                } else {
                    throw Error("Illegal parameters!");
                }
                this.sha256 = new SHA256();
                this.precomputed = [];
                // By default we pre-compute only when instructed to do so.
                this.minPrecomputed = 0;
            }
            /**
             * Precompute and store the result to be used for encryption.
             *
             * @param n - Number of values precomputed.
             */
            precompute(n = 1) {
                if (n < 1) {
                    throw Error("Number of precomputed values must " +
                        "be positive! (${n})");
                } else {
                    for (let i = 0; i < n; i++) {
                        this.precomputed.push(this.computer.precompute());
                    }
                }
            }
            /**
             * Set the threshold of promised pre-computed values.
             *
             * @param threshold - Threshold of pre-computed values.
             */
            setMinPrecomputed(threshold) {
                if (threshold < 1) {
                    throw Error("Threshold must be positive! (${threshold})");
                } else {
                    this.minPrecomputed = threshold;
                }
                while (this.precomputed.length < this.minPrecomputed) {
                    this.precomputed.push(this.computer.precompute());
                }
            }
            /**
             * Returns the number of bytes that can be encrypted.
             *
             * @returns Number of bytes that can be encrypted.
             */
            getEncodeLength() {
                return this.computer.pGroup.getEncodeLength();
            }
            /**
             * Encrypt the plaintext under the given label and return the
             * ciphertext, hash digest of ciphertext, and seed used to
             * generate randomness used to encrypt.
             *
             * @param label - Label bytes for encryption.
             * @param plaintext - Plaintext bytes to be encrypted.
             * @param hex - Converts the outputs to hexadecimal strings if
             * true.
             * @returns Promise to evaluate on a tuple consisting of a
             * ciphertext, SHA256 digest of ciphertext, and seed used for
             * encryption.
             *
             * @throws Error if any input is not correctly formatted.
             */
            encrypt(label, plaintext, hex = false) {
                if (!isByteArray(label)) {
                    throw Error("Label is not a byte array!");
                }
                if (!isByteArray(plaintext)) {
                    throw Error("Plaintext is not a byte array!");
                }
                if (plaintext.length > this.getEncodeLength()) {
                    throw Error("Plaintext is too long! (${plaintext.length})");
                }
                // The group determines how the plaintext is encoded as a
                // group element.
                const plaintextElement = this.computer.pGroup.encoded(plaintext);
                if (this.precomputed.length == 0) {
                    this.precompute();
                }
                const pro = this.precomputed.shift();
                // We replace a used pre-computed value if we fall below the
                // set threshold.
                if (this.precomputed.length < this.minPrecomputed) {
                    this.precomputed.push(this.computer.precompute());
                }
                // This should be impossible, since we have precomputed above.
                if (typeof pro === "undefined") {
                    throw Error("Missing precomputed values!");
                }
                return pro.then((pre) => {
                    const seed = pre.value[0].value;
                    const precomputed = pre.value[1];
                    const publicKey = this.computer.publicKey;
                    const ciphertextByteTree = this.computer.cryptosystem.completeEncrypt(asByteArray(label), publicKey, precomputed, plaintextElement);
                    const ciphertext = ciphertextByteTree.toByteArray();
                    const digest = this.sha256.hash(ciphertext);
                    if (hex) {
                        return [byteArrayToHex(ciphertext),
                            byteArrayToHex(digest),
                            byteArrayToHex(seed)
                        ];
                    } else {
                        return [ciphertext, digest, seed];
                    }
                });
            }
        }
        crypto.ElGamalZKPoKClient = ElGamalZKPoKClient;
        /**
         * Simplistic simulation of server that generate a public key, outputs
         * a marshalled public key and encoding of zero knowledge proof, and
         * allows decrypting ciphertexts.
         */
        class ElGamalZKPoKServer {
            /**
             * Constructs a server.
             *
             * @param randomSource - Source of randomness.
             * @param groupName - Prime order group to use.
             * @param keyWidth - Width of product group used.
             */
            constructor(randomSource, groupName, keyWidth = 1) {
                const statDist = 50;
                let pGroup = PGroupFactory.getPGroup(groupName);
                if (keyWidth > 1) {
                    pGroup = new PPGroup([pGroup, keyWidth]);
                }
                this.cryptosystem = new ElGamalZKPoKWriteIn(true, pGroup, new SHA256(), randomSource, statDist);
                [this.publicKey, this.privateKey] = this.cryptosystem.gen();
            }
            /**
             * Returns a marshalled encoding of the public key and zero
             * knowledge proof used by this server.
             *
             * @param hex - Determines if the output is encoded as a byte
             * array or in hexadecimal form.
             */
            marshalled(hex = false) {
                const bt = new ByteTree([ElGamal.marshalPK(this.publicKey),
                    new ByteTree([1])
                ]);
                if (hex) {
                    return bt.toHexString();
                } else {
                    return bt.toByteArray();
                }
            }
            /**
             * Returns the number of bytes that can be encrypted.
             *
             * @returns Number of bytes that can be encrypted.
             */
            getEncodeLength() {
                return this.publicKey.project(1).pGroup.getEncodeLength();
            }
            /**
             * Decrypts a ciphertext and throws an error if the zero knowledge
             * proof did not verify correctly.
             *
             * @param label - Label used to decrypt.
             * @param ciphertext - Ciphertext to decrypt.
             * @param ascii - Determines if the output is decoded into ASCII
             * or returned as a byte array.
             *
             * @throws Error if any input is not correctly formatted.
             */
            decrypt(label, ciphertext, ascii = false) {
                if (!isByteArray(label)) {
                    throw Error("Label is not a byte array!");
                }
                if (!isByteArray(ciphertext)) {
                    throw Error("Ciphertext is not a byte array!");
                }
                // This may throw errors.
                const cbt = ByteTree.readByteTreeFromByteArray(ciphertext);
                // This may throw errors.
                const plaintextElement = this.cryptosystem.decrypt(label, this.publicKey, this.privateKey, cbt);
                // CCA2 secure cryptosystems, i.e., ElGamal with a zero
                // knowledge proof, may throw an error in case the decryption
                // fails.
                if (typeof plaintextElement === "string") {
                    throw Error(plaintextElement);
                } else {
                    const plaintext = plaintextElement.decoded();
                    if (ascii) {
                        return byteArrayToAscii(plaintext);
                    } else {
                        return plaintext;
                    }
                }
            }
        }
        crypto.ElGamalZKPoKServer = ElGamalZKPoKServer;
        class SignatureScheme {}
        crypto.SignatureScheme = SignatureScheme;
    })(crypto = verificatum.crypto || (verificatum.crypto = {}));
})(verificatum || (verificatum = {}));
(function(verificatum) {
    let dev;
    (function(dev) {
        let bench;
        (function(bench) {
            let algebra;
            (function(algebra) {
                /**
                 * Executes a benchmark of exponentiation in this group, potentially
                 * with fixed-basis.
                 *
                 * @param pGroup - Group to be benchmarked.
                 * @param minSamples - Minimal number of samples.
                 * @param exps - Number of exponentiations to pre-compute for, or zero
                 * if no pre-computation is done.
                 * @param randomSource - Source of randomness.
                 * @returns Average number of milliseconds per exponentiation.
                 */
                function bench_PGroup_exp_inner(pGroup, minSamples, exps, randomSource) {
                    // Generate a random generator, since the standard one may be
                    // chosen to be particularly fast.
                    let g = pGroup.getg();
                    let e = pGroup.pRing.randomElement(randomSource, 50);
                    g = g.exp(e);
                    // If exps === 0, then we are not doing fixed-basis, and we set
                    // exps to one.
                    const fixed = exps > 0;
                    exps = Math.max(1, exps);
                    const start = time_ms();
                    for (let i = 0; i < minSamples; i++) {
                        if (fixed) {
                            g.fixed(exps);
                        } else {
                            for (let j = 0; j < exps; j++) {
                                e = pGroup.pRing.randomElement(randomSource, 50);
                                g.exp(e);
                            }
                        }
                    }
                    return (time_ms() - start) / (exps * minSamples);
                }
                /**
                 * Executes a benchmark of exponentiation in all named groups and
                 * returns a list of running times.
                 *
                 * @param minSamples - Minimal number of samples.
                 * @param randomSource - Source of randomness.
                 * @returns Average number of milliseconds per exponentiation.
                 */
                function bench_PGroup_exp(pGroups, minSamples, randomSource) {
                    const results = [];
                    for (let i = 0; i < pGroups.length; i++) {
                        results[i] =
                            bench_PGroup_exp_inner(pGroups[i], minSamples, 0, randomSource);
                    }
                    return results;
                }
                algebra.bench_PGroup_exp = bench_PGroup_exp;
                /**
                 * Executes a benchmark of fixed-basis exponentiation in this group
                 * and returns a list of the running times.
                 *
                 * @param pGroup - Group to be benchmarked.
                 * @param minSamples - Minimal number of samples.
                 * @param exps - Lists of number of exponentiations.
                 * @param randomSource - Source of randomness.
                 * @returns Average number of milliseconds per exponentiation.
                 */
                function bench_PGroup_fixed_inner(pGroup, minSamples, exps, randomSource) {
                    const results = [];
                    for (let i = 0; i < exps.length; i++) {
                        results[i] =
                            bench_PGroup_exp_inner(pGroup, minSamples, exps[i], randomSource);
                    }
                    return results;
                }
                /**
                 * Executes a benchmark of exponentiation in all named groups.
                 *
                 * @param pGroups - Benchmarked groups.
                 * @param minSamples - Minimal number of samples.
                 * @param exps - Lists of number of exponentiations.
                 * @param randomSource - Source of randomness.
                 * @returns Average number of milliseconds per exponentiation.
                 */
                function bench_PGroup_fixed(pGroups, minSamples, exps, randomSource) {
                    const results = [];
                    for (let i = 0; i < pGroups.length; i++) {
                        results[i] = bench_PGroup_fixed_inner(pGroups[i], minSamples, exps, randomSource);
                    }
                    return results;
                }
                algebra.bench_PGroup_fixed = bench_PGroup_fixed;
            })(algebra = bench.algebra || (bench.algebra = {}));
            let crypto;
            (function(crypto) {
                var ElGamal = verificatum.crypto.ElGamal;
                var ElGamalZKPoKWriteIn = verificatum.crypto.ElGamalZKPoKWriteIn;
                /**
                 * Estimates the running time of encryption in milliseconds.
                 *
                 * @param standard - Indicates if the standard or variant scheme is
                 * used.
                 * @param pGroup - Group over which the cryptosystem is defined.
                 * @param width - Width of plaintexts.
                 * @param minSamples - Minimum number of executions performed.
                 * @param randomSource - Source of randomness.
                 * @param statDist - Statistical distance from the uniform
                 * distribution assuming that the output of the instance of the random
                 * source is perfect.
                 * @returns Estimated running time of encryption in milliseconds.
                 */
                function bench_ElGamal_PGroup_width(standard, pGroup, width, minSamples, randomSource, statDist) {
                    const eg = new ElGamal(standard, pGroup, randomSource, statDist);
                    const keys = eg.gen();
                    const wpk = eg.widePublicKey(keys[0], width);
                    const m = wpk.pGroup.project(1).getg();
                    const start = time_ms();
                    let j = 0;
                    while (j < minSamples) {
                        eg.encrypt(wpk, m);
                        j++;
                    }
                    return (time_ms() - start) / j;
                }
                crypto.bench_ElGamal_PGroup_width = bench_ElGamal_PGroup_width;
                /**
                 * Estimates the running time of encryption in milliseconds for
                 * various widths.
                 *
                 * @param standard - Indicates if the standard or variant scheme is
                 * used.
                 * @param pGroup - Group over which the cryptosystem is defined.
                 * @param maxWidth - Maximal width of plaintexts.
                 * @param minSamples - Minimum number of executions performed.
                 * @param randomSource - Source of randomness.
                 * @param statDist - Statistical distance from the uniform
                 * distribution assuming that the output of the instance of the random
                 * source is perfect.
                 * @returns Array of estimated running times of encryption in
                 * milliseconds.
                 */
                function bench_ElGamal_PGroup(standard, pGroup, maxWidth, minSamples, randomSource, statDist) {
                    const results = [];
                    for (let i = 1; i <= maxWidth; i++) {
                        const t = bench_ElGamal_PGroup_width(standard, pGroup, i, minSamples, randomSource, statDist);
                        results.push(t);
                    }
                    return results;
                }
                crypto.bench_ElGamal_PGroup = bench_ElGamal_PGroup;
                /**
                 * Estimates the running time of encryption in milliseconds for
                 * various groups and widths.
                 *
                 * @param standard - Indicates if the standard or variant scheme is
                 * used.
                 * @param pGroups - Groups over which the cryptosystem is defined.
                 * @param maxWidth - Maximal width of plaintexts.
                 * @param minSamples - Minimum number of executions performed.
                 * @param randomSource - Source of randomness.
                 * @param statDist - Statistical distance from the uniform
                 * distribution assuming that the output of the instance of the random
                 * source is perfect.
                 * @returns Array or arrays of estimated running time of encryption in
                 * milliseconds.
                 */
                function bench_ElGamal(standard, pGroups, maxWidth, minSamples, randomSource, statDist) {
                    const results = [];
                    for (let i = 0; i < pGroups.length; i++) {
                        results[i] = bench_ElGamal_PGroup(standard, pGroups[i], maxWidth, minSamples, randomSource, statDist);
                    }
                    return results;
                }
                crypto.bench_ElGamal = bench_ElGamal;
                /**
                 * Estimates the running time of encryption in milliseconds.
                 *
                 * @param standard - Indicates if the standard or variant scheme is
                 * used.
                 * @param pGroup - Group over which the cryptosystem is defined.
                 * @param hashfunction - Hash function used for Fiat-Shamir heuristic.
                 * @param width - Width of plaintexts.
                 * @param minSamples - Minimum number of executions performed.
                 * @param randomSource - Source of randomness.
                 * @param statDist - Statistical distance from the uniform
                 * distribution assuming that the output of the instance of the random
                 * source is perfect.
                 * @returns Estimated running time of encryption in milliseconds.
                 */
                function bench_ElGamalZKPoKWriteIn_PGroup_width(standard, pGroup, hashfunction, width, minSamples, randomSource, statDist) {
                    const eg = new ElGamalZKPoKWriteIn(standard, pGroup, hashfunction, randomSource, statDist);
                    const keys = eg.gen();
                    const wpk = eg.widePublicKey(keys[0], width);
                    const m = wpk.pGroup.project(1).getg();
                    const label = randomSource.getBytes(10);
                    const start = time_ms();
                    let j = 0;
                    while (j < minSamples) {
                        eg.encrypt(label, wpk, m);
                        j++;
                    }
                    return (time_ms() - start) / j;
                }
                crypto.bench_ElGamalZKPoKWriteIn_PGroup_width = bench_ElGamalZKPoKWriteIn_PGroup_width;
                /**
                 * Estimates the running time of encryption in milliseconds for
                 * various widths.
                 *
                 * @param standard - Indicates if the standard or variant scheme is
                 * used.
                 * @param pGroup - Group over which the cryptosystem is defined.
                 * @param hashfunction - Hash function used for Fiat-Shamir heuristic.
                 * @param maxWidth - Maximal width of plaintexts.
                 * @param minSamples - Minimum number of executions performed.
                 * @param randomSource - Source of randomness.
                 * @param statDist - Statistical distance from the uniform
                 * distribution assuming that the output of the instance of the random
                 * source is perfect.
                 * @returns Array of estimated running times of encryption in
                 * milliseconds.
                 */
                function bench_ElGamalZKPoKWriteIn_PGroup(standard, pGroup, hashfunction, maxWidth, minSamples, randomSource, statDist) {
                    const results = [];
                    for (let i = 1; i <= maxWidth; i++) {
                        const t = bench_ElGamalZKPoKWriteIn_PGroup_width(standard, pGroup, hashfunction, i, minSamples, randomSource, statDist);
                        results.push(t);
                    }
                    return results;
                }
                crypto.bench_ElGamalZKPoKWriteIn_PGroup = bench_ElGamalZKPoKWriteIn_PGroup;
                /**
                 * Estimates the running time of encryption in milliseconds for
                 * various groups and widths.
                 *
                 * @param standard - Indicates if the standard or variant scheme is
                 * used.
                 * @param pGroups - Groups over which the cryptosystem is defined.
                 * @param hashfunction - Hash function used for Fiat-Shamir heuristic.
                 * @param maxWidth - Maximal width of plaintexts.
                 * @param minSamples - Minimum number of executions performed.
                 * @param randomSource - Source of randomness.
                 * @param statDist - Statistical distance from the uniform
                 * distribution assuming that the output of the instance of the random
                 * source is perfect.
                 * @returns Array or arrays of estimated running time of encryption in
                 * milliseconds.
                 */
                function bench_ElGamalZKPoKWriteIn(standard, pGroups, hashfunction, maxWidth, minSamples, randomSource, statDist) {
                    const results = [];
                    for (let i = 0; i < pGroups.length; i++) {
                        results[i] = bench_ElGamalZKPoKWriteIn_PGroup(standard, pGroups[i], hashfunction, maxWidth, minSamples, randomSource, statDist);
                    }
                    return results;
                }
                crypto.bench_ElGamalZKPoKWriteIn = bench_ElGamalZKPoKWriteIn;
            })(crypto = bench.crypto || (bench.crypto = {}));
            var ECqPGroup = verificatum.algebra.ECqPGroup;
            var ModPGroup = verificatum.algebra.ModPGroup;
            var PGroupFactory = verificatum.algebra.PGroupFactory;
            var SHA256 = verificatum.crypto.SHA256;
            var SHA256PRG = verificatum.crypto.SHA256PRG;
            var asciiToByteArray = verificatum.base.asciiToByteArray;
            var bench_ElGamal = verificatum.dev.bench.crypto.bench_ElGamal;
            var bench_ElGamalZKPoKWriteIn = verificatum.dev.bench.crypto.bench_ElGamalZKPoKWriteIn;
            var bench_PGroup_exp = verificatum.dev.bench.algebra.bench_PGroup_exp;
            var bench_PGroup_fixed = verificatum.dev.bench.algebra.bench_PGroup_fixed;
            /**
             * Provides formatting functions for benchmarks.
             * TSDOC_MODULE
             */
            /**
             * Returns a string representation of the today's date.
             * @returns Today's date.
             */
            function today() {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = today.getMonth() + 1;
                const dd = today.getDate();
                // let: mms;
                // if (mm < 10) {
                //     mms = "0" + mm;
                // }
                // if (dd < 10) {
                //     dd = "0" + dd;
                // }
                return `${yyyy}-${mm}-${dd}`;
            }
            bench.today = today;
            /**
             * Returns a list of indices.
             *
             * @param maxWidth - Maximum index.
             * @returns List of indices.
             */
            function getIndices(maxWidth) {
                const indices = [];
                for (let i = 0; i < maxWidth; i++) {
                    indices[i] = i + 1;
                }
                return indices;
            }
            bench.getIndices = getIndices;
            const txtPad = 16;
            const numPad = 8;
            /**
             * Formats a list of benchmark results as a text table.
             *
             * @param pGroupNames - List of group names.
             * @param results - List of running times.
             * @returns Text output.
             */
            function grpTableTXT(pGroupNames, results) {
                let s = "Group".padEnd(txtPad, " ") + "ms / exp\n";
                for (let i = 0; i < results.length; i++) {
                    s += pGroupNames[i].padEnd(txtPad, " ");
                    s += results[i].toFixed(1).toString().padStart(numPad) + "\n";
                }
                return s;
            }
            bench.grpTableTXT = grpTableTXT;
            /**
             * Formats a list of benchmark results as a HTML table.
             *
             * @param pGroupNames - List of group names.
             * @param results - List of running times.
             * @returns HTML code for output.
             */
            function grpTableHTML(pGroupNames, results) {
                let s = "<table>\n";
                s += "<tr>" +
                    "<th>Group</th>" +
                    "<th>ms / exp</th>" +
                    "</tr>\n";
                for (let i = 0; i < results.length; i++) {
                    s += "<tr>";
                    s += "<td>" + pGroupNames[i] + "</td>";
                    s += "<td style=\"text-align:right\">";
                    s += results[i].toFixed(1);
                    s += "</td>";
                    s += "</tr>\n";
                }
                s += "</table>";
                return s;
            }
            bench.grpTableHTML = grpTableHTML;
            /**
             * Returns HTML code for a header row.
             *
             * @param header - Header string.
             * @returns Header row.
             */
            function grpIntHeaderHTML(header, indices) {
                let s = "<tr>\n<th>Group \\ " + header + "</th>\n";
                for (let i = 0; i < indices.length; i++) {
                    s += "<th>" + indices[i] + "</th>\n";
                }
                s += "</tr><h>\n";
                return s;
            }
            bench.grpIntHeaderHTML = grpIntHeaderHTML;
            /**
             * Returns HTML code for a row of results.
             *
             * @param pGroupName - Name of a group.
             * @param rowResults - Row of results.
             * @returns Result row.
             */
            function grpIntRowHTML(pGroupName, rowResults) {
                let s = "<tr>\n<td>" + pGroupName + "</td>\n";
                for (let i = 0; i < rowResults.length; i++) {
                    s += "<td style=\"text-align:right\">";
                    s += rowResults[i].toFixed(1);
                    s += "</td>\n";
                }
                s += "</tr>\n";
                return s;
            }
            bench.grpIntRowHTML = grpIntRowHTML;
            /**
             * Returns HTML code for table of results.
             *
             * @param header - Name of a group.
             * @param indices - Indices
             * @param pGroupNames - List of group names.
             * @param results - Table of running times.
             * @returns HTML code for the given results.
             */
            function grpIntTableHTML(header, indices, pGroupNames, results) {
                let s = "<table>\n";
                s += grpIntHeaderHTML(header, indices);
                for (let i = 0; i < results.length; i++) {
                    s += grpIntRowHTML(pGroupNames[i], results[i]);
                }
                s += "</table>";
                return s;
            }
            bench.grpIntTableHTML = grpIntTableHTML;
            /**
             * Returns text for a header row.
             *
             * @param header - Header string.
             * @returns Header row.
             */
            function grpIntHeaderTXT(header, indices) {
                let s = ("Group \\ " + header).padEnd(txtPad, " ");
                for (let i = 0; i < indices.length; i++) {
                    s += indices[i].toString().padStart(numPad, " ");
                }
                s += "\n";
                return s;
            }
            bench.grpIntHeaderTXT = grpIntHeaderTXT;
            /**
             * Returns text for a row of results.
             *
             * @param pGroupName - Name of a group.
             * @param rowResults - Row of results.
             * @returns Result row.
             */
            function grpIntRowTXT(pGroupName, rowResults) {
                let s = pGroupName.padEnd(txtPad, " ");
                for (let i = 0; i < rowResults.length; i++) {
                    s += rowResults[i].toFixed(1).toString().padStart(numPad, " ");
                }
                s += "\n";
                return s;
            }
            bench.grpIntRowTXT = grpIntRowTXT;
            /**
             * Returns  text for table of results.
             *
             * @param header - Name of a group.
             * @param indices - Indices
             * @param pGroupNames - List of group names.
             * @param results - Table of running times.
             * @returns Text for the given results.
             */
            function grpIntTableTXT(header, indices, pGroupNames, results) {
                let s = grpIntHeaderTXT(header, indices);
                for (let i = 0; i < results.length; i++) {
                    s += grpIntRowTXT(pGroupNames[i], results[i]);
                }
                return s;
            }
            bench.grpIntTableTXT = grpIntTableTXT;
            /**
             * Test suite for library.
             */
            class Suite {
                /**
                 * Constructs a test suite.
                 *
                 * @param statDist - Statistical distance.
                 * @param maxWidth - Maximal width of ciphertexts.
                 * @param seed - Seed for pseudo random generator.
                 */
                constructor(statDist, maxWidth, seed, outputFormat) {
                    this.statDist = statDist;
                    this.maxWidth = maxWidth;
                    this.hashfunction = new SHA256();
                    this.randomSource = new SHA256PRG();
                    const seedBytes = asciiToByteArray(seed);
                    this.randomSource.setSeed(seedBytes);
                    if (outputFormat == "txt") {
                        this.grpTable = grpTableTXT;
                        this.grpIntTable = grpIntTableTXT;
                    } else {
                        this.grpTable = grpTableHTML;
                        this.grpIntTable = grpIntTableHTML;
                    }
                }
                benchmarks() {
                    return [
                        "ModPGroup.exp",
                        "ECqPGroup.exp",
                        "FixModPow.exp",
                        "ElGamal",
                        "ElGamalZKPoKWriteIn",
                        "NaorYung"
                    ];
                }
                /**
                 *
                 *
                 * @param exponent - Exponent.
                 * @returns Array of exponents.
                 */
                bench(command, minSamples) {
                    const cryptoPGroupNames = [
                        "modp3072",
                        "modp4096",
                        "modp6144",
                        "P-256",
                        "secp384r1",
                        "P-521"
                    ];
                    if (command == "ECqPGroup.exp") {
                        const pGroupNames = ECqPGroup.getPGroupNames();
                        const pGroups = ECqPGroup.getPGroups();
                        const results = bench_PGroup_exp(pGroups, minSamples, this.randomSource);
                        return [command,
                            this.grpTable(pGroupNames, results)
                        ];
                    } else if (command == "ModPGroup.exp") {
                        const pGroupNames = ModPGroup.getPGroupNames();
                        const pGroups = ModPGroup.getPGroups();
                        const results = bench_PGroup_exp(pGroups, minSamples, this.randomSource);
                        return [command,
                            this.grpTable(pGroupNames, results)
                        ];
                    } else if (command == "FixModPow.exp") {
                        const pGroupNames = ["modp3072",
                            "modp4096",
                            "modp6144"
                        ];
                        const exps = [0, 1, 2, 4, 8, 16, 32];
                        const pGroups = PGroupFactory.getPGroups(pGroupNames);
                        const results = bench_PGroup_fixed(pGroups, minSamples, exps, this.randomSource);
                        return [command,
                            this.grpIntTable("Exps", exps, pGroupNames, results)
                        ];
                    } else if (command == "ElGamal") {
                        const indices = getIndices(this.maxWidth);
                        const pGroups = PGroupFactory.getPGroups(cryptoPGroupNames);
                        const results = bench_ElGamal(true, pGroups, this.maxWidth, minSamples, this.randomSource, this.statDist);
                        return [command, this.grpIntTable("Width", indices, cryptoPGroupNames, results)];
                    } else if (command == "ElGamalZKPoKWriteIn") {
                        const indices = getIndices(this.maxWidth);
                        const pGroups = PGroupFactory.getPGroups(cryptoPGroupNames);
                        const results = bench_ElGamalZKPoKWriteIn(true, pGroups, this.hashfunction, this.maxWidth, minSamples, this.randomSource, this.statDist);
                        return [command, this.grpIntTable("Width", indices, cryptoPGroupNames, results)];
                    } else if (command == "NaorYung") {
                        const indices = getIndices(this.maxWidth);
                        const pGroups = PGroupFactory.getPGroups(cryptoPGroupNames);
                        const results = bench_ElGamalZKPoKWriteIn(false, pGroups, this.hashfunction, this.maxWidth, minSamples, this.randomSource, this.statDist);
                        return [command, this.grpIntTable("Width", indices, cryptoPGroupNames, results)];
                    } else {
                        throw Error("Unknown command! (" + command + ")");
                    }
                }
            }
            bench.Suite = Suite;
        })(bench = dev.bench || (dev.bench = {}));
        let test;
        (function(test) {
            let arithm;
            (function(arithm) {
                var FixModPow = verificatum.arithm.FixModPow;
                var LI = verificatum.arithm.LI;
                var ModPowAlg = verificatum.arithm.ModPowAlg;
                var ModPowProd = verificatum.arithm.ModPowProd;
                var WORDSIZE = verificatum.arithm.uli.WORDSIZE;
                var add = verificatum.arithm.uli.add;
                var cmp = verificatum.arithm.uli.cmp;
                var div3by2 = verificatum.arithm.uli.div3by2;
                var div_qr = verificatum.arithm.uli.div_qr;
                var hex = verificatum.arithm.uli.hex;
                var iszero = verificatum.arithm.uli.iszero;
                var msword = verificatum.arithm.uli.msword;
                var mul = verificatum.arithm.uli.mul;
                var mul_mont = verificatum.arithm.li.mul_mont;
                var neg = verificatum.arithm.uli.neg;
                var neginvm_mont = verificatum.arithm.li.neginvm_mont;
                var newarray = verificatum.arithm.uli.newarray;
                var normalize = verificatum.arithm.uli.normalize;
                var reciprocal_word = verificatum.arithm.uli.reciprocal_word;
                var reciprocal_word_3by2 = verificatum.arithm.uli.reciprocal_word_3by2;
                var set = verificatum.arithm.uli.set;
                var sub = verificatum.arithm.uli.sub;
                // Small primes useful for testing.
                arithm.small_primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997, 1009, 1013, 1019, 1021, 1031, 1033, 1039, 1049, 1051, 1061, 1063, 1069, 1087, 1091, 1093, 1097, 1103, 1109, 1117, 1123, 1129, 1151, 1153, 1163, 1171, 1181, 1187, 1193, 1201, 1213, 1217, 1223, 1229, 1231, 1237, 1249, 1259, 1277, 1279, 1283, 1289, 1291, 1297, 1301, 1303, 1307, 1319, 1321, 1327, 1361, 1367, 1373, 1381, 1399, 1409, 1423, 1427, 1429, 1433, 1439, 1447, 1451, 1453, 1459, 1471, 1481, 1483, 1487, 1489, 1493, 1499, 1511, 1523, 1531, 1543, 1549, 1553, 1559, 1567, 1571, 1579, 1583, 1597, 1601, 1607, 1609, 1613, 1619, 1621, 1627, 1637, 1657, 1663, 1667, 1669, 1693, 1697, 1699, 1709, 1721, 1723, 1733, 1741, 1747, 1753, 1759, 1777, 1783, 1787, 1789, 1801, 1811, 1823, 1831, 1847, 1861, 1867, 1871, 1873, 1877, 1879, 1889, 1901, 1907, 1913, 1931, 1933, 1949, 1951, 1973, 1979, 1987, 1993, 1997, 1999, 2003, 2011, 2017, 2027, 2029, 2039, 2053, 2063, 2069, 2081, 2083, 2087, 2089, 2099, 2111, 2113, 2129, 2131, 2137, 2141, 2143, 2153, 2161, 2179, 2203, 2207, 2213, 2221, 2237, 2239, 2243, 2251, 2267, 2269, 2273, 2281, 2287, 2293, 2297, 2309, 2311, 2333, 2339, 2341, 2347, 2351, 2357, 2371, 2377, 2381, 2383, 2389, 2393, 2399, 2411, 2417, 2423, 2437, 2441, 2447, 2459, 2467, 2473, 2477, 2503, 2521, 2531, 2539, 2543, 2549, 2551, 2557, 2579, 2591, 2593, 2609, 2617, 2621, 2633, 2647, 2657, 2659, 2663, 2671, 2677, 2683, 2687, 2689, 2693, 2699, 2707, 2711, 2713, 2719, 2729, 2731, 2741, 2749, 2753, 2767, 2777, 2789, 2791, 2797, 2801, 2803, 2819, 2833, 2837, 2843, 2851, 2857, 2861, 2879, 2887, 2897, 2903, 2909, 2917, 2927, 2939, 2953, 2957, 2963, 2969, 2971, 2999, 3001, 3011, 3019, 3023, 3037, 3041, 3049, 3061, 3067, 3079, 3083, 3089, 3109, 3119, 3121, 3137, 3163, 3167, 3169, 3181, 3187, 3191, 3203, 3209, 3217, 3221, 3229, 3251, 3253, 3257, 3259, 3271, 3299, 3301, 3307, 3313, 3319, 3323, 3329, 3331, 3343, 3347, 3359, 3361, 3371, 3373, 3389, 3391, 3407, 3413, 3433, 3449, 3457, 3461, 3463, 3467, 3469, 3491, 3499, 3511, 3517, 3527, 3529, 3533, 3539, 3541, 3547, 3557, 3559, 3571, 3581, 3583, 3593, 3607, 3613, 3617, 3623, 3631, 3637, 3643, 3659, 3671, 3673, 3677, 3691, 3697, 3701, 3709, 3719, 3727, 3733, 3739, 3761, 3767, 3769, 3779, 3793, 3797, 3803, 3821, 3823, 3833, 3847, 3851, 3853, 3863, 3877, 3881, 3889, 3907, 3911, 3917, 3919, 3923, 3929, 3931, 3943, 3947, 3967, 3989, 4001, 4003, 4007, 4013, 4019, 4021, 4027, 4049, 4051, 4057, 4073, 4079, 4091, 4093, 4099, 4111, 4127, 4129, 4133, 4139, 4153, 4157, 4159, 4177, 4201, 4211, 4217, 4219, 4229, 4231, 4241, 4243, 4253, 4259, 4261, 4271, 4273, 4283, 4289, 4297, 4327, 4337, 4339, 4349, 4357, 4363, 4373, 4391, 4397, 4409, 4421, 4423, 4441, 4447, 4451, 4457, 4463, 4481, 4483, 4493, 4507, 4513, 4517, 4519, 4523, 4547, 4549, 4561, 4567, 4583, 4591, 4597, 4603, 4621, 4637, 4639, 4643, 4649, 4651, 4657, 4663, 4673, 4679, 4691, 4703, 4721, 4723, 4729, 4733, 4751, 4759, 4783, 4787, 4789, 4793, 4799, 4801, 4813, 4817, 4831, 4861, 4871, 4877, 4889, 4903, 4909, 4919, 4931, 4933, 4937, 4943, 4951, 4957, 4967, 4969, 4973, 4987, 4993, 4999, 5003, 5009, 5011, 5021, 5023, 5039, 5051, 5059, 5077, 5081, 5087, 5099, 5101, 5107, 5113, 5119, 5147, 5153, 5167, 5171, 5179, 5189, 5197, 5209, 5227, 5231, 5233, 5237, 5261, 5273, 5279, 5281, 5297, 5303, 5309, 5323, 5333, 5347, 5351, 5381, 5387, 5393, 5399, 5407, 5413, 5417, 5419, 5431, 5437, 5441, 5443, 5449, 5471, 5477, 5479, 5483, 5501, 5503, 5507, 5519, 5521, 5527, 5531, 5557, 5563, 5569, 5573, 5581, 5591, 5623, 5639, 5641, 5647, 5651, 5653, 5657, 5659, 5669, 5683, 5689, 5693, 5701, 5711, 5717, 5737, 5741, 5743, 5749, 5779, 5783, 5791, 5801, 5807, 5813, 5821, 5827, 5839, 5843, 5849, 5851, 5857, 5861, 5867, 5869, 5879, 5881, 5897, 5903, 5923, 5927, 5939, 5953, 5981, 5987, 6007, 6011, 6029, 6037, 6043, 6047, 6053, 6067, 6073, 6079, 6089, 6091, 6101, 6113, 6121, 6131, 6133, 6143, 6151, 6163, 6173, 6197, 6199, 6203, 6211, 6217, 6221, 6229, 6247, 6257, 6263, 6269, 6271, 6277, 6287, 6299, 6301, 6311, 6317, 6323, 6329, 6337, 6343, 6353, 6359, 6361, 6367, 6373, 6379, 6389, 6397, 6421, 6427, 6449, 6451, 6469, 6473, 6481, 6491, 6521, 6529, 6547, 6551, 6553, 6563, 6569, 6571, 6577, 6581, 6599, 6607, 6619, 6637, 6653, 6659, 6661, 6673, 6679, 6689, 6691, 6701, 6703, 6709, 6719, 6733, 6737, 6761, 6763, 6779, 6781, 6791, 6793, 6803, 6823, 6827, 6829, 6833, 6841, 6857, 6863, 6869, 6871, 6883, 6899, 6907, 6911, 6917, 6947, 6949, 6959, 6961, 6967, 6971, 6977, 6983, 6991, 6997, 7001, 7013, 7019, 7027, 7039, 7043, 7057, 7069, 7079, 7103, 7109, 7121, 7127, 7129, 7151, 7159, 7177, 7187, 7193, 7207, 7211, 7213, 7219, 7229, 7237, 7243, 7247, 7253, 7283, 7297, 7307, 7309, 7321, 7331, 7333, 7349, 7351, 7369, 7393, 7411, 7417, 7433, 7451, 7457, 7459, 7477, 7481, 7487, 7489, 7499, 7507, 7517, 7523, 7529, 7537, 7541, 7547, 7549, 7559, 7561, 7573, 7577, 7583, 7589, 7591, 7603, 7607, 7621, 7639, 7643, 7649, 7669, 7673, 7681, 7687, 7691, 7699, 7703, 7717, 7723, 7727, 7741, 7753, 7757, 7759, 7789, 7793, 7817, 7823, 7829, 7841, 7853, 7867, 7873, 7877, 7879, 7883, 7901, 7907, 7919];
                // Large safe primes useful for testing.
                arithm.safe_primes = [
                    "01970e2e8a60c345b31d85debed9053ad61e15a0a87fca07114bcc330fdfa7c49f",
                    "02f62ad5c74210285fb6ec7a06d664d88e1ef3ed9066b9857121c3b4ee8c7c1987",
                    "0768e94e55eba37f8243003c231a205482b46db046f17e4ad7c064bf6f8811903b",
                    "0d4395e7da60f2bb28709184870547cbbc948fb1e67a3923f44cc1d297170e9787"
                ];
                const liprefix = "verificatum.arithm.uli";
                const MASK_ALL = (1 << WORDSIZE) - 1;
                const MASK_ALL_2 = [MASK_ALL, MASK_ALL, 0];
                const MASK_ALL_3 = [MASK_ALL, MASK_ALL, MASK_ALL];

                function INSECURErandom_uli_t(bitLength) {
                    const noWords = Math.floor((bitLength + 28 - 1) / 28);
                    const zeroBits = noWords * 28 - bitLength;
                    const x = [];
                    for (let i = 0; i < noWords; i++) {
                        x[i] = Math.floor(Math.random() * 0x10000000);
                        x[i] &= 0xfffffff;
                    }
                    x[x.length - 1] &= 0xfffffff >>> zeroBits;
                    normalize(x);
                    return x;
                }

                function test_twos_negation(tc) {
                    const endTime = tc.start([liprefix + " (negation in two's complement)"], tc.testTime);
                    // This is exhaustive.
                    let i = 1;
                    const s = 100;
                    while (!tc.done(endTime)) {
                        const x = INSECURErandom_uli_t(i);
                        const y = [];
                        y.length = x.length + 1;
                        const z = [];
                        z.length = x.length + 1;
                        neg(y, x);
                        add(z, x, y);
                        if (!iszero(z)) {
                            tc.error("Negation failed!" +
                                "\nx = 0x" + hex(x) +
                                "\ny = 0x" + hex(y) +
                                "\nz = 0x" + hex(z));
                        }
                        if (i == s) {
                            i = 1;
                        }
                    }
                    tc.end();
                }
                arithm.test_twos_negation = test_twos_negation;

                function test_neginvm_mont(tc) {
                    let ex = "";
                    if (WORDSIZE < 22) {
                        ex = " - exhaustive";
                    }
                    tc.start([liprefix + ` (neginvm_mont${ex})`], tc.testTime);
                    // tpw = 2^28
                    const tpw = [0x0, 0x1];
                    const nw = [0, 0];
                    const m = [0];
                    const w = [0];
                    const p = newarray(m.length + tpw.length + 2);
                    const q = newarray(Math.max(0, m.length - tpw.length) + 1);
                    // This is exhaustive when WORDSIZE < 2^20. Compile with
                    // WORDSIZE=20 to run it this way.
                    const max_m0 = 1 << Math.min(20, WORDSIZE);
                    for (let m0 = 1; m0 < max_m0; m0 += 2) {
                        // m = m0 mod 2^28
                        m[0] = m0;
                        // w = -m^(-1) mod m
                        const w0 = neginvm_mont(m);
                        w[0] = w0;
                        // nw = m^(-1) mod 2^28
                        sub(nw, tpw, w);
                        // p = m * m^(-1)
                        mul(p, m, nw);
                        // p = p mod 2^28
                        div_qr(q, p, tpw);
                        // -m^(-1) * m = 1 mod 2^28
                        if (cmp(p, [1]) != 0) {
                            tc.error("Incorrect Montgomery inverse!" +
                                "\nb = 0x" + hex(tpw) +
                                "\nm = 0x" + hex(m) +
                                "\nw = 0x" + hex(w));
                        }
                    }
                    tc.end();
                }
                arithm.test_neginvm_mont = test_neginvm_mont;

                function test_reciprocal_word(tc) {
                    tc.start([liprefix + " (reciprocal_word - exhaustive)"], tc.testTime);
                    const d = [0];
                    const v = [0, 0];
                    const p = [0, 0, 0];
                    const r = [0, 0, 0];
                    // This is exhaustive.
                    let i = 0;
                    while (i < (1 << (WORDSIZE - 1))) {
                        d[0] = i;
                        d[0] |= (1 << (WORDSIZE - 1));
                        // 2by1 reciprocal of d.
                        v[0] = reciprocal_word(d[0]);
                        // Add 2**WORDSIZE.
                        v[1] = 1;
                        // Check that the reciprocal is in the right interval by
                        // using it.
                        // p = (v + 2^WORDSIZE) * d
                        mul(p, v, d);
                        // 2^(2 * WORDSIZE) - 1 - p
                        sub(r, MASK_ALL_2, p);
                        if (cmp(r, d) >= 0) {
                            tc.error("Too small reciprocal!" +
                                "\nd = 0x" + hex(d) +
                                "\nr = 0x" + hex(r) +
                                "\nv = " + v[0]);
                        }
                        i++;
                    }
                    tc.end();
                }
                arithm.test_reciprocal_word = test_reciprocal_word;

                function test_reciprocal_word_3by2(tc) {
                    const endTime = tc.start([liprefix + " (reciprocal_word_3by2)"], tc.testTime);
                    const v = [0, 0];
                    const p = [0, 0, 0, 0];
                    const r = [0, 0, 0, 0];
                    while (!tc.done(endTime)) {
                        // Divisor with leading bit set.
                        const d = INSECURErandom_uli_t(2 * WORDSIZE);
                        d[1] |= (1 << (WORDSIZE - 1));
                        // 3by2 reciprocal of d.
                        v[0] = reciprocal_word_3by2(d);
                        // Add 2**(2 * WORDSIZE).
                        v[1] = 1;
                        // Check that the reciprocal is in the right interval by
                        // using it.
                        // p = (v + 2^(2 * WORDSIZE)) * d
                        mul(p, v, d);
                        // 2^(3 * WORDSIZE) - 1 - p
                        sub(r, MASK_ALL_3, p);
                        if (cmp(r, d) >= 0) {
                            tc.error("Too small reciprocal!" +
                                "\nd = 0x" + hex(d) +
                                "\nr = 0x" + hex(r) +
                                "\nv = " + v[0]);
                        }
                    }
                    tc.end();
                }
                arithm.test_reciprocal_word_3by2 = test_reciprocal_word_3by2;

                function test_div3by2(tc) {
                    const endTime = tc.start([liprefix + " (div3by2)"], tc.testTime);
                    let d;
                    let u;
                    let v;
                    let q;
                    const p = [0, 0, 0, 0];
                    const r = [0, 0];
                    // Negative of d in two's complement.
                    const neg_d = [0, 0];
                    while (!tc.done(endTime)) {
                        do {
                            // Divisor with leading bit set.
                            d = INSECURErandom_uli_t(2 * WORDSIZE);
                            d[1] |= (1 << (WORDSIZE - 1));
                            // Dividend such that u < 2^WORDSIZE * d
                            u = INSECURErandom_uli_t(3 * WORDSIZE);
                        } while (u[2] >= d[1] ||
                            (u[2] == d[1] && u[1] >= d[0]));
                        sub(neg_d, [0, 0], d);
                        // Reciprocal.
                        v = reciprocal_word_3by2(d);
                        q = div3by2(r, u, d, neg_d, v);
                        if (cmp(r, d) >= 0) {
                            tc.error("Too small reciprocal!" +
                                "\nu = 0x" + hex(u) +
                                "\nd = 0x" + hex(d) +
                                "\nq = " + q +
                                "\nr = 0x" + hex(r));
                        }
                        mul(p, [q], d);
                        add(p, p, r);
                        if (cmp(p, u) !== 0) {
                            tc.error("Numbers do not add up!" +
                                "\nu = 0x" + hex(u) +
                                "\nd = 0x" + hex(d) +
                                "\nq = " + q +
                                "\nr = 0x" + hex(r));
                        }
                    }
                    tc.end();
                }
                arithm.test_div3by2 = test_div3by2;

                function test_uli(tc) {
                    test_twos_negation(tc);
                    test_reciprocal_word(tc);
                    test_reciprocal_word_3by2(tc);
                    test_div3by2(tc);
                    test_neginvm_mont(tc);
                }
                arithm.test_uli = test_uli;
                const LIprefix = "verificatum.arithm.LI";

                function test_identities(tc) {
                    let e;
                    const endTime = tc.start([LIprefix + " (identities)"], tc.testTime);
                    const ONE = LI.ONE;
                    const ZERO = LI.ZERO;
                    if (!ONE.add(ZERO).equals(ONE) ||
                        !ZERO.add(ONE).equals(ONE) ||
                        !ZERO.add(ZERO).equals(ZERO)) {
                        tc.error("Ones and zeros don't add!");
                    }
                    if (!ONE.mul(ZERO).equals(ZERO) ||
                        !ZERO.mul(ONE).equals(ZERO) ||
                        !ZERO.mul(ZERO).equals(ZERO) ||
                        !ONE.mul(ONE).equals(ONE)) {
                        tc.error("Ones and zeros don't multiply!");
                    }
                    let i = 1;
                    while (!tc.done(endTime)) {
                        // We test both positive and negative integers.
                        for (let j = 0; j < 2; j++) {
                            // Operations with zero and one.
                            let x = new LI(i, tc.randomSource);
                            if (j & 0x1) {
                                x = x.neg();
                            }
                            let a = ZERO.add(x);
                            let b = x.add(ZERO);
                            if (!a.equals(x) || !b.equals(x)) {
                                e = "Addition with zero is not identity!" +
                                    "\nx = 0x" + x.toHexString() +
                                    "\n0 + x = 0x" + a.toHexString() +
                                    "\nx + 0 = 0x" + b.toHexString();
                                tc.error(e);
                            }
                            a = ONE.mul(x);
                            b = x.mul(ONE);
                            if (!a.equals(x) || !b.equals(x)) {
                                e = "Multiplication with one is not identity!" +
                                    "\nx = 0x" + x.toHexString() +
                                    "\n1 * x = 0x" + a.toHexString() +
                                    "\nx * 1 = 0x" + b.toHexString();
                                tc.error(e);
                            }
                        }
                        i++;
                    }
                    tc.end();
                }
                arithm.test_identities = test_identities;

                function test_addition_commutativity(tc) {
                    let e;
                    const endTime = tc.start([LIprefix + " (addition commutativity)"], tc.testTime);
                    const s = 100;
                    while (!tc.done(endTime)) {
                        let i = 1;
                        while (!tc.done(endTime) && i < s) {
                            let j = 1;
                            while (!tc.done(endTime) && j < s) {
                                // We try all combinations of signs.
                                for (let k = 0; k < 4; k++) {
                                    let x = new LI(i, tc.randomSource);
                                    if (k & 0x1) {
                                        x = x.neg();
                                    }
                                    let y = new LI(j, tc.randomSource);
                                    if (k & 0x2) {
                                        y = y.neg();
                                    }
                                    const a = x.add(y);
                                    const b = y.add(x);
                                    if (!a.equals(b)) {
                                        e = "Addition is not commutative!" +
                                            "\nx = 0x" + x.toHexString() +
                                            "\ny = 0x" + y.toHexString() +
                                            "\na = 0x" + a.toHexString() +
                                            "\nb = 0x" + b.toHexString();
                                        tc.error(e);
                                    }
                                }
                                j++;
                            }
                            i++;
                        }
                    }
                    tc.end();
                }
                arithm.test_addition_commutativity = test_addition_commutativity;

                function test_addition_associativity(tc) {
                    let e;
                    const endTime = tc.start([LIprefix + " (addition associativity)"], tc.testTime);
                    const s = 100;
                    while (!tc.done(endTime)) {
                        let i = 1;
                        while (!tc.done(endTime) && i < s) {
                            let j = 1;
                            while (!tc.done(endTime) && j < s) {
                                let k = 1;
                                while (!tc.done(endTime) && k < s) {
                                    // We try all combinations of signs.
                                    for (let l = 0; l < 8; l++) {
                                        let x = new LI(i, tc.randomSource);
                                        if (l & 0x1) {
                                            x = x.neg();
                                        }
                                        let y = new LI(j, tc.randomSource);
                                        if (l & 0x2) {
                                            y = y.neg();
                                        }
                                        let z = new LI(k, tc.randomSource);
                                        if (l & 0x4) {
                                            z = z.neg();
                                        }
                                        const a = (x.add(y)).add(z);
                                        const b = x.add(y.add(z));
                                        if (!a.equals(b)) {
                                            e = "Addition is not associative!" +
                                                "\nx = 0x" + x.toHexString() +
                                                "\ny = 0x" + y.toHexString() +
                                                "\nz = 0x" + z.toHexString() +
                                                "\na = 0x" + a.toHexString() +
                                                "\nb = 0x" + b.toHexString();
                                            tc.error(e);
                                        }
                                    }
                                    k++;
                                }
                                j++;
                            }
                            i++;
                        }
                    }
                    tc.end();
                }
                arithm.test_addition_associativity = test_addition_associativity;

                function test_multiplication_commutativity(tc) {
                    let e;
                    const endTime = tc.start([LIprefix + " (multiplication commutativity)"], tc.testTime);
                    const s = 100;
                    while (!tc.done(endTime)) {
                        let i = 1;
                        while (!tc.done(endTime) && i < s) {
                            let j = 1;
                            while (!tc.done(endTime) && j < s) {
                                // We try all combinations of signs.
                                for (let k = 0; k < 4; k++) {
                                    let x = new LI(i, tc.randomSource);
                                    if (k & 0x1) {
                                        x = x.neg();
                                    }
                                    let y = new LI(j, tc.randomSource);
                                    if (k & 0x2) {
                                        y = y.neg();
                                    }
                                    const a = x.mul(y);
                                    const b = y.mul(x);
                                    if (!a.equals(b)) {
                                        e = "Multiplication is not commutative!" +
                                            "\nx = 0x" + x.toHexString() +
                                            "\ny = 0x" + y.toHexString() +
                                            "\na = 0x" + a.toHexString() +
                                            "\nb = 0x" + b.toHexString();
                                        tc.error(e);
                                    }
                                }
                                j++;
                            }
                            i++;
                        }
                    }
                    tc.end();
                }
                arithm.test_multiplication_commutativity = test_multiplication_commutativity;

                function test_squaring(tc) {
                    let e;
                    const endTime = tc.start([LIprefix + " (squaring)"], tc.testTime);
                    const s = 100;
                    let i = 1;
                    while (!tc.done(endTime)) {
                        // We try all combinations of signs.
                        for (let k = 0; k < 1; k++) {
                            let x = new LI(i, tc.randomSource);
                            if (k & 0x1) {
                                x = x.neg();
                            }
                            const y = x.mul(LI.ONE);
                            const a = x.square();
                            const b = x.mul(y);
                            if (!a.equals(b)) {
                                e = "Squaring is inconsistent with multiplication!" +
                                    "\nx = 0x" + x.toHexString() +
                                    "\na = 0x" + a.toHexString() +
                                    "\nb = 0x" + b.toHexString();
                                tc.error(e);
                            }
                        }
                        i = ((i + 1) % s) + 1;
                    }
                    tc.end();
                }
                arithm.test_squaring = test_squaring;

                function test_multiplication_associativity(tc) {
                    let e;
                    const endTime = tc.start([LIprefix + " (multiplication associativity)"], tc.testTime);
                    const s = 100;
                    while (!tc.done(endTime)) {
                        let i = 1;
                        while (!tc.done(endTime) && i < s) {
                            let j = 1;
                            while (!tc.done(endTime) && j < s) {
                                let k = 1;
                                while (!tc.done(endTime) && k < s) {
                                    // We try all combinations of signs.
                                    for (let l = 0; l < 8; l++) {
                                        let x = new LI(i, tc.randomSource);
                                        if (l & 0x1) {
                                            x = x.neg();
                                        }
                                        let y = new LI(j, tc.randomSource);
                                        if (l & 0x2) {
                                            y = y.neg();
                                        }
                                        let z = new LI(k, tc.randomSource);
                                        if (l & 0x4) {
                                            z = z.neg();
                                        }
                                        const a = (x.mul(y)).mul(z);
                                        const b = x.mul(y.mul(z));
                                        if (!a.equals(b)) {
                                            e = "Multiplication is not associative!" +
                                                "\nx = 0x" + x.toHexString() +
                                                "\ny = 0x" + y.toHexString() +
                                                "\nz = 0x" + z.toHexString() +
                                                "\na = 0x" + a.toHexString() +
                                                "\nb = 0x" + b.toHexString();
                                            tc.error(e);
                                        }
                                    }
                                    k++;
                                }
                                j++;
                            }
                            i++;
                        }
                    }
                    tc.end();
                }
                arithm.test_multiplication_associativity = test_multiplication_associativity;

                function test_distributivity(tc) {
                    let e;
                    const endTime = tc.start([LIprefix + " (distributivity)"], tc.testTime);
                    const s = 100;
                    while (!tc.done(endTime)) {
                        let i = 1;
                        while (!tc.done(endTime) && i < s) {
                            let j = 1;
                            while (!tc.done(endTime) && j < s) {
                                let k = 1;
                                while (!tc.done(endTime) && k < s) {
                                    // We try all combinations of signs.
                                    for (let l = 0; l < 8; l++) {
                                        let x = new LI(i, tc.randomSource);
                                        if (l & 0x1) {
                                            x = x.neg();
                                        }
                                        let y = new LI(j, tc.randomSource);
                                        if (l & 0x2) {
                                            y = y.neg();
                                        }
                                        let z = new LI(k, tc.randomSource);
                                        if (l & 0x4) {
                                            z = z.neg();
                                        }
                                        const a = x.mul(y.add(z));
                                        const b = x.mul(y).add(x.mul(z));
                                        if (!a.equals(b)) {
                                            e = "Multiplication and addition are not " +
                                                "transitive!" +
                                                "\nx = 0x" + x.toHexString() +
                                                "\ny = 0x" + y.toHexString() +
                                                "\nz = 0x" + z.toHexString() +
                                                "\na = 0x" + a.toHexString() +
                                                "\nb = 0x" + b.toHexString();
                                            tc.error(e);
                                        }
                                    }
                                    k++;
                                }
                                j++;
                            }
                            i++;
                        }
                    }
                    tc.end();
                }
                arithm.test_distributivity = test_distributivity;

                function test_division_with_zero_remainder(tc) {
                    let e;
                    const endTime = tc.start([LIprefix + " (division without remainder)"], tc.testTime);
                    const s = 100;
                    while (!tc.done(endTime)) {
                        let i = 1;
                        while (!tc.done(endTime) && i < s) {
                            let j = 1;
                            while (!tc.done(endTime) && j < s) {
                                const x = new LI(i, tc.randomSource);
                                let y = new LI(j, tc.randomSource);
                                while (y.iszero()) {
                                    y = new LI(j, tc.randomSource);
                                }
                                const p = x.mul(y);
                                const q = p.div(y);
                                if (!q.equals(x)) {
                                    e = "Division with zero remainder failed!" +
                                        "\nx = 0x" + x.toHexString() +
                                        "\ny = 0x" + y.toHexString() +
                                        "\np = 0x" + p.toHexString() +
                                        "\nq = 0x" + q.toHexString();
                                    tc.error(e);
                                }
                                j++;
                            }
                            i++;
                        }
                    }
                    tc.end();
                }
                arithm.test_division_with_zero_remainder = test_division_with_zero_remainder;

                function test_division_with_remainder(tc) {
                    let e;
                    const endTime = tc.start([LIprefix + " (division with remainder)"], tc.testTime);
                    const s = 100;
                    while (!tc.done(endTime)) {
                        let i = 1;
                        while (!tc.done(endTime) && i < s) {
                            let j = 1;
                            while (!tc.done(endTime) && j < s) {
                                const x = new LI(i, tc.randomSource);
                                let y = new LI(j, tc.randomSource);
                                while (y.iszero()) {
                                    y = new LI(j, tc.randomSource);
                                }
                                const q = x.div(y);
                                const r = x.mod(y);
                                const xx = q.mul(y).add(r);
                                if (!xx.equals(x)) {
                                    e = "Division with remainder failed!" +
                                        "\nx = 0x" + x.toHexString() +
                                        "\ny = 0x" + y.toHexString() +
                                        "\nq = 0x" + q.toHexString() +
                                        "\nr = 0x" + r.toHexString() +
                                        "\nxx = 0x" + xx.toHexString();
                                    tc.error(e);
                                }
                                j++;
                            }
                            i++;
                        }
                    }
                    tc.end();
                }
                arithm.test_division_with_remainder = test_division_with_remainder;

                function test_modpow(tc, alg) {
                    let e;
                    const algname = ModPowAlg[alg];
                    const endTime = tc.start([LIprefix + ` (naive and ${algname} modpow agree)`], tc.testTime);
                    const one = LI.ONE.modPow(LI.ZERO, LI.TWO);
                    if (!one.equals(LI.ONE)) {
                        tc.error("Failed to exponentiate with zero!");
                    }
                    const s = 100;
                    while (!tc.done(endTime)) {
                        let i = 1;
                        while (!tc.done(endTime) && i < s) {
                            let j = 1;
                            while (!tc.done(endTime) && j < s) {
                                let k = 1;
                                while (!tc.done(endTime) && k < s) {
                                    let z = LI.ZERO;
                                    while (z.iszero()) {
                                        z = new LI(k, tc.randomSource);
                                        // We need an odd modulus for Montgomery
                                        // exponentiation to work at all.
                                        if (alg == ModPowAlg.montgomery && z.getBit(0) === 0) {
                                            z = z.add(LI.ONE);
                                        }
                                    }
                                    let x = (new LI(i, tc.randomSource)).mod(z);
                                    let y1 = new LI(j, tc.randomSource);
                                    const y2 = new LI(j, tc.randomSource);
                                    // Check that 1^y1 = 0 mod 1, and
                                    // 1^y1 = 1 mod z for z > 1.
                                    let c = LI.ONE.modPow(y1, z);
                                    if (z.equals(LI.ONE)) {
                                        if (!c.equals(LI.ZERO)) {
                                            e = "Power of one modulo one is not zero!" +
                                                "\ny1 = 0x" + y1.toHexString() +
                                                "\nz = 0x" + z.toHexString() +
                                                "\nc = 0x" + c.toHexString();
                                            tc.error(e);
                                        }
                                    } else if (!c.equals(LI.ONE)) {
                                        e = "Power of one modulo modulus > 1 is not one!" +
                                            "\ny1 = 0x" + y1.toHexString() +
                                            "\nz = 0x" + z.toHexString() +
                                            "\nc = 0x" + c.toHexString();
                                        tc.error(e);
                                    }
                                    const a = x.modPow(y1, z, alg);
                                    // Consistency with naive modpow
                                    let b = x.modPow(y1, z, ModPowAlg.naive);
                                    if (!a.equals(b)) {
                                        e = "Modpow and naive modpow are inconsistent!" +
                                            "\nx = 0x" + x.toHexString() +
                                            "\ny1 = 0x" + y1.toHexString() +
                                            "\nz = 0x" + z.toHexString() +
                                            "\na = 0x" + a.toHexString() +
                                            "\nb = 0x" + b.toHexString();
                                        tc.error(e);
                                    }
                                    // Linearity.
                                    b = x.modPow(y2, z, alg);
                                    const ab = a.mul(b);
                                    c = ab.mod(z);
                                    const ysum = y1.add(y2);
                                    const cc = x.modPow(ysum, z, alg);
                                    if (!cc.equals(c)) {
                                        e = "Modpow is not linear in exponent!" +
                                            "\nx = 0x" + x.toHexString() +
                                            "\ny1 = 0x" + y1.toHexString() +
                                            "\ny2 = 0x" + y2.toHexString() +
                                            "\nysum = 0x" + ysum.toHexString() +
                                            "\nz = 0x" + z.toHexString() +
                                            "\na = 0x" + a.toHexString() +
                                            "\nb = 0x" + b.toHexString() +
                                            "\nab = 0x" + ab.toHexString() +
                                            "\nc = 0x" + c.toHexString() +
                                            "\ncc = 0x" + cc.toHexString();
                                        tc.error(e);
                                    }
                                    k++;
                                }
                                j++;
                            }
                            i++;
                        }
                    }
                    tc.end();
                }
                arithm.test_modpow = test_modpow;

                function test_egcd(tc) {
                    let e;
                    const endTime = tc.start([LIprefix + " (egcd)"], tc.testTime);
                    const s = 100;
                    while (!tc.done(endTime)) {
                        let i = 1;
                        while (!tc.done(endTime) && i < s) {
                            let j = 1;
                            while (!tc.done(endTime) && j < s) {
                                const x = new LI(i, tc.randomSource);
                                const y = new LI(j, tc.randomSource);
                                const res = x.egcd(y);
                                const a = res[0];
                                const b = res[1];
                                const v = res[2];
                                const c = a.mul(x).add(b.mul(y));
                                if (!c.equals(v)) {
                                    e = "Linear function does not give GCD!" +
                                        "\nx = 0x" + x.toHexString() +
                                        "\ny = 0x" + y.toHexString() +
                                        "\na = 0x" + a.toHexString() +
                                        "\nb = 0x" + b.toHexString() +
                                        "\nv = 0x" + v.toHexString() +
                                        "\nc = 0x" + c.toHexString();
                                    tc.error(e);
                                }
                                j++;
                            }
                            i++;
                        }
                    }
                    tc.end();
                }
                arithm.test_egcd = test_egcd;

                function test_legendre(tc) {
                    let e;
                    const endTime = tc.start([LIprefix + " (legendre)"], tc.testTime);
                    const primes = [];
                    for (let i = 0; i < arithm.safe_primes.length; i++) {
                        primes.push(new LI(arithm.safe_primes[i]));
                    }
                    const s = 100;
                    let i = 1;
                    while (!tc.done(endTime)) {
                        for (let j = 0; j < primes.length; j++) {
                            const x = new LI(i, tc.randomSource);
                            const y = x.neg();
                            // Here we use the fact that -1 is a non-residue.
                            const lx = x.legendre(primes[j]);
                            const ly = y.legendre(primes[j]);
                            if ((x.iszero() && (lx !== 0 || ly !== 0)) ||
                                (!x.iszero() &&
                                    (Math.abs(lx) !== 1 || Math.abs(ly) !== 1 || lx === ly))) {
                                e = "Computation of Legendre symbol failed!" +
                                    "\nx = 0x" + x.toHexString() +
                                    "\ny = 0x" + y.toHexString() +
                                    "\nlx = 0x" + lx +
                                    "\nly = 0x" + ly;
                                tc.error(e);
                            }
                        }
                        if (i === s) {
                            i = 1;
                        } else {
                            i++;
                        }
                    }
                    tc.end();
                }
                arithm.test_legendre = test_legendre;

                function test_modSqrt(tc) {
                    let e;
                    const endTime = tc.start([LIprefix + " (sqrt)"], tc.testTime);
                    const primes = [];
                    for (let i = 0; i < arithm.safe_primes.length; i++) {
                        primes.push(new LI(arithm.safe_primes[i]));
                    }
                    const s = 100;
                    let i = 1;
                    while (!tc.done(endTime)) {
                        for (let j = 0; j < primes.length; j++) {
                            let x = new LI(i, tc.randomSource);
                            let y = x.mul(x).mod(primes[j]);
                            let z = y.modSqrt(primes[j]);
                            // We don't care which of the roots we get.
                            let w = z.mul(z).mod(primes[j]);
                            if (!w.equals(y)) {
                                e = "Computation of square root failed!" +
                                    "\np = 0x" + primes[j].toHexString() +
                                    "\nx = 0x" + x.toHexString() +
                                    "\ny = 0x" + y.toHexString() +
                                    "\nz = 0x" + z.toHexString() +
                                    "\nw = 0x" + w.toHexString();
                                tc.error(e);
                            }
                        }
                        if (i === s) {
                            i = 1;
                        } else {
                            i++;
                        }
                    }
                    tc.end();
                }
                arithm.test_modSqrt = test_modSqrt;

                function test_conversion(tc) {
                    let e;
                    const endTime = tc.start([LIprefix + " (conversion)"], tc.testTime);
                    const s = 100;
                    let i = 1;
                    while (!tc.done(endTime)) {
                        const x = new LI(i, tc.randomSource);
                        const byteArray = x.toByteArray();
                        const y = new LI(byteArray);
                        if (!x.equals(y)) {
                            e = "Conversion failed!" +
                                "\nx = 0x" + x.toHexString() +
                                "\ny = 0x" + y.toHexString();
                            tc.error(e);
                        }
                        if (i === s) {
                            i = 1;
                        } else {
                            i++;
                        }
                    }
                    tc.end();
                }
                arithm.test_conversion = test_conversion;

                function test_shifting(tc) {
                    let e;
                    const endTime = tc.start([LIprefix + " (shift)"], tc.testTime);
                    const s = 100;
                    let i = 1;
                    while (!tc.done(endTime)) {
                        const x = new LI(i, tc.randomSource);
                        for (let j = 0; j <= 64; j++) {
                            const lx = x.shiftLeft(j);
                            const y = lx.shiftRight(j);
                            if (!x.equals(y)) {
                                e = "Shift failed!" +
                                    "\nx = 0x" + x.toHexString() +
                                    "\ny = 0x" + y.toHexString();
                                tc.error(e);
                            }
                        }
                        const rx = x.shiftRight(i + 1);
                        if (!rx.equals(LI.ZERO)) {
                            e = "Right shift failed!" +
                                "\nx = 0x" + x.toHexString();
                            tc.error(e);
                        }
                        if (i === s) {
                            i = 1;
                        } else {
                            i++;
                        }
                    }
                    tc.end();
                }
                arithm.test_shifting = test_shifting;

                function test_hex(tc) {
                    tc.start([LIprefix + " (hex)"], tc.testTime);
                    const x = new LI(100, tc.randomSource);
                    const xhex = x.toHexString();
                    const x2 = new LI(xhex);
                    if (!x.equals(x2)) {
                        tc.error("Failed to convert positive integer to hex! (" + xhex + ")");
                    }
                    const y = new LI(100, tc.randomSource);
                    const yhey = y.toHexString();
                    const y2 = new LI(yhey);
                    if (!y.equals(y2)) {
                        tc.error("Failed to convert negative integer to hex! (" +
                            yhey + ")");
                    }
                    tc.end();
                }
                arithm.test_hex = test_hex;

                function test_mul_mont_word(tc) {
                    // We need this test be fast to allow us to perform exhaustive
                    // testing. Thus, we tinker with the internal values of LI
                    // instances.
                    let e;
                    let ex = "";
                    if (WORDSIZE <= 8) {
                        ex = " - exhaustive";
                    }
                    tc.start([LIprefix + ` (mul_mont for word moduli${ex})`], tc.testTime);
                    const bound = 1 << Math.min(8, WORDSIZE);
                    // m < 2^28, so we have two additional zero words.
                    let m = new LI(1, [1, 0, 0]);
                    // R = b^1, where b = 2^28.
                    const R = LI.ONE.shiftLeft(WORDSIZE);
                    // These arrays are not normalized internally when we initialize
                    // like this.
                    const x = new LI(1, [1, 0, 0]);
                    const y = new LI(1, [1, 0, 0]);
                    // a must have twice as many limbs as m.
                    const uli_a = [0, 0, 0, 0, 0, 0];
                    for (let m0 = 1; m0 < bound; m0 += 2) {
                        // Rmodinv = R^(-1) mod m. Always exist, since R is a power of
                        // two and m is odd.
                        let Rmodminv = R.mod(m).modInv(m);
                        for (let x0 = 0; x0 < m0; x0 += 1) {
                            x.value[0] = x0;
                            x.sign = (x0 == 0) ? 0 : 1;
                            for (let y0 = 0; y0 < m0; y0 += 1) {
                                y.value[0] = y0;
                                y.sign = (y0 == 0) ? 0 : 1;
                                // a = x * y * Rmodinv mod m using Montgomery
                                // multiplication.
                                const uli_m = [m.value[0], 0, 0];
                                mul_mont(uli_a, x.value, y.value, uli_m);
                                // a = x * y * Rmodinv mod m computed naively.
                                let a = x.mul(y).mod(m).mul(Rmodminv).mod(m);
                                if (cmp(uli_a, a.value) != 0) {
                                    e = "Montgomery multiplication failed for word moduli!" +
                                        "\nR = 0x" + R.toHexString() +
                                        "\nRmodminv = 0x" + Rmodminv.toHexString() +
                                        "\nm = 0x" + m.toHexString() +
                                        "\nx = 0x" + x.toHexString() +
                                        "\ny = 0x" + y.toHexString() +
                                        "\na = 0x" + hex(uli_a) +
                                        "\naa = 0x" + a.toHexString();
                                    tc.error(e);
                                }
                            }
                        }
                        m = m.add(LI.TWO);
                    }
                    tc.end();
                }
                arithm.test_mul_mont_word = test_mul_mont_word;

                function test_mul_mont(tc) {
                    let e;
                    const endTime = tc.start([LIprefix + " (mul_mont for large moduli)"], tc.testTime);
                    const s = 100;
                    let bitLength = 2;
                    while (!tc.done(endTime)) {
                        // Odd integer with exactly bitLength bits.
                        let LI_m = new LI(bitLength - 1, tc.randomSource);
                        LI_m = LI_m.add(LI.ONE.shiftLeft(bitLength - 1));
                        if (LI_m.getBit(0) == 0) {
                            LI_m = LI_m.add(LI.ONE);
                        }
                        // Smallest n such that m < b^n.
                        const n = msword(LI_m.value) + 1;
                        // R = b^n, where b = 2^28.
                        const LI_R = LI.ONE.shiftLeft(n * 28);
                        // Rmodinv = R^(-1) mod m. Always exist, since R is a power of
                        // two and m is odd.
                        const LI_Rmodminv = LI_R.mod(LI_m).modInv(LI_m);
                        // Random integers 0 <= x, y < m.
                        const LI_x = new LI(bitLength + 50, tc.randomSource).mod(LI_m);
                        const LI_y = new LI(bitLength + 50, tc.randomSource).mod(LI_m);
                        // a = x * y * Rmodinv mod m using Montgomery multiplication.
                        let uli_m = newarray(LI_m.value.length + 2);
                        let uli_x = newarray(uli_m.length);
                        let uli_y = newarray(uli_m.length);
                        let uli_a = newarray(2 * uli_m.length);
                        set(uli_m, LI_m.value);
                        set(uli_x, LI_x.value);
                        set(uli_y, LI_y.value);
                        mul_mont(uli_a, uli_x, uli_y, uli_m);
                        // a = x * y * Rmodinv mod m computed naively.
                        const LI_a = LI_x.mul(LI_y).mod(LI_m).mul(LI_Rmodminv).mod(LI_m);
                        if (cmp(uli_a, LI_a.value) != 0) {
                            e = "Montgomery multiplication failed!" +
                                "\nn = " + n +
                                "\nR = 0x" + LI_R.toHexString() +
                                "\nRmodinv = 0x" + LI_Rmodminv.toHexString() +
                                "\nm = 0x" + LI_m.toHexString() +
                                "\nx = 0x" + LI_x.toHexString() +
                                "\ny = 0x" + LI_y.toHexString() +
                                "\na = 0x" + hex(uli_a) +
                                "\naa = 0x" + LI_a.toHexString();
                            tc.error(e);
                        }
                        bitLength = (bitLength + 1) % s;
                        if (bitLength === 0) {
                            bitLength = 2;
                        }
                    }
                    tc.end();
                }
                arithm.test_mul_mont = test_mul_mont;

                function test_LI(tc) {
                    test_identities(tc);
                    test_addition_commutativity(tc);
                    test_addition_associativity(tc);
                    test_squaring(tc);
                    test_multiplication_commutativity(tc);
                    test_multiplication_associativity(tc);
                    test_distributivity(tc);
                    test_division_with_zero_remainder(tc);
                    test_division_with_remainder(tc);
                    test_mul_mont_word(tc);
                    test_mul_mont(tc);
                    test_modpow(tc, ModPowAlg.window);
                    test_modpow(tc, ModPowAlg.montgomery);
                    test_egcd(tc);
                    test_legendre(tc);
                    test_modSqrt(tc);
                    test_conversion(tc);
                    test_shifting(tc);
                    test_hex(tc);
                }
                arithm.test_LI = test_LI;
                /**
                 * Compute a power-product using the given bases, exponents, and
                 * modulus. This is a naive implementation for simple use and to debug
                 * {@link ModPowProd.modPowProd}.
                 *
                 * @param bases - Bases.
                 * @param exponents - Exponents.
                 * @param modulus - Modulus.
                 * @returns Power product.
                 */
                function modPowProd_naive(bases, exponents, modulus) {
                    let result = LI.ONE;
                    for (let i = 0; i < bases.length; i++) {
                        result = result.modMul(bases[i].modPow(exponents[i], modulus), modulus);
                    }
                    return result;
                }

                function test_ModPowProd(tc) {
                    const prefix = "verificatum.arithm.ModPowProd";
                    let e;
                    let i;
                    const endTime = tc.start([prefix + " (agrees with naive)"], tc.testTime);
                    const modulus = new LI(arithm.safe_primes[0]);
                    const maxNoBases = 30;
                    while (!tc.done(endTime)) {
                        for (let noBases = 1; noBases <= maxNoBases; noBases++) {
                            const bases = [];
                            for (i = 0; i < noBases; i++) {
                                bases[i] = new LI(modulus.bitLength(), tc.randomSource);
                                bases[i] = bases[i].mod(modulus);
                            }
                            // Exponents should have somewhat different bit lengths.
                            const exponents = [];
                            for (i = 0; i < noBases; i++) {
                                const len = Math.max(1, modulus.bitLength() - 5 + i);
                                exponents[i] = new LI(len, tc.randomSource);
                            }
                            const maxWidth = Math.min(noBases, ModPowProd.maxWidth);
                            for (let width = 1; width <= maxWidth; width++) {
                                const mpp = new ModPowProd(bases, modulus, width);
                                const a = mpp.modPowProd(exponents);
                                const b = modPowProd_naive(bases, exponents, modulus);
                                if (!a.equals(b)) {
                                    e = "Modular power products disagrees!" +
                                        "\nnoBases = " + noBases +
                                        "\nwidth = " + width +
                                        "\na = " + a.toHexString() +
                                        "\nb = " + b.toHexString() +
                                        "\nm = " + modulus.toHexString();
                                    tc.error(e);
                                }
                            }
                        }
                    }
                    tc.end();
                }
                arithm.test_ModPowProd = test_ModPowProd;

                function test_FixModPow(tc) {
                    const prefix = "verificatum.arithm.FixModPow";
                    const endTime = tc.start([prefix + " (agrees with naive)"], tc.testTime);
                    const modulus = new LI(arithm.safe_primes[0]);
                    while (!tc.done(endTime)) {
                        const basis = new LI(modulus.bitLength(), tc.randomSource);
                        for (let width = 1; width <= 8; width++) {
                            const fmp = new FixModPow(basis, modulus, 20, width);
                            for (let i = 1; i < modulus.bitLength() + 5; i++) {
                                const exponent = new LI(i, tc.randomSource);
                                const b = fmp.modPow(exponent);
                                const c = basis.modPow(exponent, modulus);
                                if (!b.equals(c)) {
                                    const e = "Fixed-base exponentiation is wrong!" +
                                        "\nb = " + b.toHexString() +
                                        "\nc = " + c.toHexString();
                                    tc.error(e);
                                }
                            }
                        }
                    }
                    tc.end();
                }
                arithm.test_FixModPow = test_FixModPow;

                function test_arithm(tc) {
                    const prefix = "verificatum/arithm/";
                    tc.startSet(prefix);
                    test_uli(tc);
                    test_LI(tc);
                    test_ModPowProd(tc);
                    test_FixModPow(tc);
                }
                arithm.test_arithm = test_arithm;
            })(arithm = test.arithm || (test.arithm = {}));
            let algebra;
            (function(algebra) {
                var ByteTree = verificatum.algebra.ByteTree;
                var ECqPGroup = verificatum.algebra.ECqPGroup;
                var LI = verificatum.arithm.LI;
                var ModPGroup = verificatum.algebra.ModPGroup;
                var PField = verificatum.algebra.PField;
                var PGroupFactory = verificatum.algebra.PGroupFactory;
                var PPGroup = verificatum.algebra.PPGroup;
                var PPRing = verificatum.algebra.PPRing;
                var byteArrayToHex = verificatum.base.byteArrayToHex;
                var equalsArray = verificatum.base.equalsArray;
                var randomArray = verificatum.base.randomArray;
                var safe_primes = verificatum.dev.test.arithm.safe_primes;
                var small_primes = verificatum.dev.test.arithm.small_primes;
                const prefix = "verificatum.algebra.ByteTree";

                function test_valid(tc) {
                    const endTime = tc.start([prefix + " (valid)"], tc.testTime);
                    const simpleLen = 20;
                    let len = 1;
                    while (!tc.done(endTime)) {
                        /* eslint-disable @typescript-eslint/no-explicit-any */
                        const data = randomArray(len, 8, tc.randomSource);
                        /* eslint-enable @typescript-eslint/no-explicit-any */
                        // Create leaf from raw data.
                        const btc = new ByteTree(data);
                        if (!equalsArray(data, btc.value) ||
                            btc.nodeType !== ByteTree.LEAF) {
                            tc.error("Failed to create leaf from raw data!");
                        }
                        // Turn it into a byte array, recover it, turn it into a byte
                        // array and compare.
                        const bt1 = new ByteTree(data);
                        const ba1 = bt1.toByteArray();
                        const bt2 = ByteTree.readByteTreeFromByteArray(ba1);
                        const ba2 = bt2.toByteArray();
                        if (!equalsArray(ba1, ba2)) {
                            tc.error("Failed to store and recover leaf to/from " +
                                "byte array!");
                        }
                        // Turn it into a hex string, recover it, turn it into a hex
                        // string and compare.
                        const hex1 = bt1.toHexString();
                        const hexbt2 = new ByteTree(hex1);
                        const hex2 = hexbt2.toHexString();
                        if (hex1 !== hex2) {
                            tc.error("Failed to store and recover leaf to/from hex " +
                                "string!");
                        }
                        // Create complex tree.
                        const bts = [];
                        for (let i = 1; i < 20; i++) {
                            /* eslint-disable @typescript-eslint/no-explicit-any */
                            const t = randomArray(i * len, 8, tc.randomSource);
                            /* eslint-enable @typescript-eslint/no-explicit-any */
                            bts.push(new ByteTree(t));
                        }
                        const c1 = new ByteTree(bts.slice(0, 3));
                        const c2 = new ByteTree(bts.slice(3, 5));
                        const c3 = new ByteTree(bts.slice(5, 8));
                        const c4 = new ByteTree([c1, c2]);
                        const c5 = new ByteTree([c3, bts[15]]);
                        // Turn it into a hex string, recover it, turn it into a
                        // hex string and compare.
                        const cbt1 = new ByteTree([c1, c2, c3, c4, c5]);
                        for (let k = 0; k < 2; k++) {
                            const squeeze = (k === 1);
                            const hexcbt1 = cbt1.toHexString(squeeze);
                            const cbt2 = new ByteTree(hexcbt1, squeeze);
                            const hexcbt2 = cbt2.toHexString(squeeze);
                            if (hexcbt1 !== hexcbt2) {
                                tc.error("Failed to store and recover byte tree to/from " +
                                    "hex string with squeeze = ${squeeze}!");
                            }
                        }
                        const si = cbt1.size();
                        const le = cbt1.toByteArray().length;
                        if (si != le) {
                            tc.error("Computation of size is wrong! (");
                        }
                        len = len % (simpleLen - 1) + 1;
                    }
                    tc.end();
                }
                algebra.test_valid = test_valid;

                function test_invalid(tc) {
                    tc.start([prefix + " (invalid)"], tc.testTime);
                    const len = 10;
                    let failed;
                    let iba;
                    /* eslint-disable @typescript-eslint/no-explicit-any */
                    const data = randomArray(len, 8, tc.randomSource);
                    /* eslint-enable @typescript-eslint/no-explicit-any */
                    const bt = new ByteTree(data);
                    iba = bt.toByteArray();
                    iba[0] = 2;
                    failed = true;
                    try {
                        ByteTree.readByteTreeFromByteArray(iba);
                    } catch (err) {
                        failed = false;
                    }
                    if (failed) {
                        tc.error("Failed to complain about invalid type!");
                    }
                    iba = bt.toByteArray();
                    iba[1] |= 0x80;
                    failed = true;
                    try {
                        ByteTree.readByteTreeFromByteArray(iba);
                    } catch (err) {
                        failed = false;
                    }
                    if (failed) {
                        tc.error("Failed to complain about negative length!");
                    }
                    iba = bt.toByteArray();
                    iba[4] += 1;
                    failed = true;
                    try {
                        ByteTree.readByteTreeFromByteArray(iba);
                    } catch (err) {
                        failed = false;
                    }
                    if (failed) {
                        tc.error("Failed to complain about missing bytes!");
                    }
                    tc.end();
                }
                algebra.test_invalid = test_invalid;

                function test_conversion(tc) {
                    let e;
                    const endTime = tc.start([prefix + " (conversion LI)"], tc.testTime);
                    const s = 100;
                    let i = 1;
                    while (!tc.done(endTime)) {
                        const x = new LI(i, tc.randomSource);
                        const byteTree = ByteTree.LItoByteTree(x);
                        const z = ByteTree.byteTreeToLI(byteTree);
                        if (!x.equals(z)) {
                            e = "Conversion failed!" +
                                "\nx = 0x" + x.toHexString() +
                                "\nz = 0x" + z.toHexString();
                            tc.error(e);
                        }
                        if (i === s) {
                            i = 1;
                        } else {
                            i++;
                        }
                    }
                    tc.end();
                }
                algebra.test_conversion = test_conversion;

                function test_ByteTree(tc) {
                    test_valid(tc);
                    test_invalid(tc);
                }
                algebra.test_ByteTree = test_ByteTree;
                class TestPRing {
                    constructor(tc, prefix, pRings) {
                        this.tc = tc;
                        this.prefix = prefix;
                        this.pRings = pRings;
                    }
                    identities() {
                        const endTime = this.tc.start([this.prefix + " (identities)"], this.tc.testTime);
                        for (let i = 0; i < this.pRings.length; i++) {
                            const ONE = this.pRings[i].getONE();
                            const ZERO = this.pRings[i].getZERO();
                            if (!ONE.add(ZERO).equals(ONE) ||
                                !ZERO.add(ONE).equals(ONE) ||
                                !ZERO.add(ZERO).equals(ZERO)) {
                                this.tc.error("Ones and zeros don't add!");
                            }
                            if (!ONE.mul(ZERO).equals(ZERO) ||
                                !ZERO.mul(ONE).equals(ZERO) ||
                                !ZERO.mul(ZERO).equals(ZERO) ||
                                !ONE.mul(ONE).equals(ONE)) {
                                this.tc.error("Ones and zeros don't multiply!");
                            }
                        }
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            const ONE = this.pRings[i].getONE();
                            const ZERO = this.pRings[i].getZERO();
                            // Operations with zero and one.
                            const x = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            let a = ZERO.add(x);
                            let b = x.add(ZERO);
                            if (!a.equals(x) || !b.equals(x)) {
                                const e = "Addition with zero is not identity function!" +
                                    "\nx = " + x.toString() +
                                    "\n0 + x = " + a.toString() +
                                    "\nx + 0 = " + b.toString();
                                this.tc.error(e);
                            }
                            a = ONE.mul(x);
                            b = x.mul(ONE);
                            if (!a.equals(x) || !b.equals(x)) {
                                const e = "Multiplication with one is not identity!" +
                                    "\nx = " + x.toString() +
                                    "\n1 * x = " + a.toString() +
                                    "\nx * 1 = " + b.toString();
                                this.tc.error(e);
                            }
                            i = (i + 1) % this.pRings.length;
                        }
                        this.tc.end();
                    }
                    addition_commutativity() {
                        const endTime = this.tc.start([this.prefix + " (addition commutativity)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            const x = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const y = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const a = x.add(y);
                            const b = y.add(x);
                            if (!a.equals(b)) {
                                const e = "Addition is not commutative!" +
                                    "\nx = " + x.toString() +
                                    "\ny = " + y.toString() +
                                    "\na = " + a.toString() +
                                    "\nb = " + b.toString();
                                this.tc.error(e);
                            }
                            i = (i + 1) % this.pRings.length;
                        }
                        this.tc.end();
                    }
                    addition_associativity() {
                        const endTime = this.tc.start([this.prefix + " (addition associativity)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            const x = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const y = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const z = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const a = (x.add(y)).add(z);
                            const b = x.add(y.add(z));
                            if (!a.equals(b)) {
                                const e = "Addition is not associative!" +
                                    "\nx = " + x.toString() +
                                    "\ny = " + y.toString() +
                                    "\nz = " + z.toString() +
                                    "\na = " + a.toString() +
                                    "\nb = " + b.toString();
                                this.tc.error(e);
                            }
                            i = (i + 1) % this.pRings.length;
                        }
                        this.tc.end();
                    }
                    multiplication_commutativity() {
                        const endTime = this.tc.start([this.prefix + " (multiplication commutativity)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            const x = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const y = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const a = x.mul(y);
                            const b = y.mul(x);
                            if (!a.equals(b)) {
                                const e = "Multiplication is not commutative!" +
                                    "\nx = " + x.toString() +
                                    "\ny = " + y.toString() +
                                    "\na = " + a.toString() +
                                    "\nb = " + b.toString();
                                this.tc.error(e);
                            }
                            i = (i + 1) % this.pRings.length;
                        }
                        this.tc.end();
                    }
                    multiplication_associativity() {
                        const endTime = this.tc.start([this.prefix + " (multiplication associativity)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            const x = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const y = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const z = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const a = (x.mul(y)).mul(z);
                            const b = x.mul(y.mul(z));
                            if (!a.equals(b)) {
                                const e = "Multiplication is not associative!" +
                                    "\nx = " + x.toString() +
                                    "\ny = " + y.toString() +
                                    "\nz = " + z.toString() +
                                    "\na = " + a.toString() +
                                    "\nb = " + b.toString();
                                this.tc.error(e);
                            }
                            i = (i + 1) % this.pRings.length;
                        }
                        this.tc.end();
                    }
                    distributivity() {
                        const endTime = this.tc.start([this.prefix + " (distributivity)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            const x = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const y = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const z = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const a = x.mul(y.add(z));
                            const b = x.mul(y).add(x.mul(z));
                            if (!a.equals(b)) {
                                const e = "Multiplication and addition are not transitive!" +
                                    "\nx = " + x.toString() +
                                    "\ny = " + y.toString() +
                                    "\nz = " + z.toString() +
                                    "\na = " + a.toString() +
                                    "\nb = " + b.toString();
                                this.tc.error(e);
                            }
                            i = (i + 1) % this.pRings.length;
                        }
                        this.tc.end();
                    }
                    subtraction() {
                        const endTime = this.tc.start([this.prefix + " (subtraction)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            const x = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const y = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const a = x.sub(y);
                            const b = a.sub(x);
                            const c = b.add(y);
                            if (!c.equals(this.pRings[i].getZERO())) {
                                const e = "Subtraction is not an additive inverse!" +
                                    "\nx = " + x.toString() +
                                    "\ny = " + y.toString() +
                                    "\na = " + a.toString() +
                                    "\nb = " + b.toString() +
                                    "\nc = " + c.toString();
                                this.tc.error(e);
                            }
                            i = (i + 1) % this.pRings.length;
                        }
                        this.tc.end();
                    }
                    conversion() {
                        const endTime = this.tc.start([this.prefix + " (conversion)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            const x = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const byteTree = x.toByteTree();
                            const y = this.pRings[i].toElement(byteTree);
                            if (!y.equals(x)) {
                                const e = "Conversion to/from byte tree failed!" +
                                    "\nx = " + x.toString() +
                                    "\ny = " + y.toString();
                                this.tc.error(e);
                            }
                            i = (i + 1) % this.pRings.length;
                        }
                        this.tc.end();
                    }
                    inversion() {
                        const endTime = this.tc.start([this.prefix + " (inversion)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            let x = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            while (!x.invertible()) {
                                x = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            }
                            let y = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            while (!y.invertible()) {
                                y = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            }
                            // We check that x * y^{-1} * x^{-1} * y.
                            const a = x.mul(y.inv()).mul(x.inv()).mul(y);
                            const ONE = this.pRings[i].getONE();
                            if (!a.equals(ONE)) {
                                const e = "Inversion is not a multiplicative inverse!" +
                                    "\nx = " + x.toString() +
                                    "\ny = " + y.toString() +
                                    "\na = " + a.toString();
                                this.tc.error(e);
                            }
                            i = (i + 1) % this.pRings.length;
                        }
                        this.tc.end();
                    }
                    hex() {
                        this.tc.start([this.prefix + " (hex)"], this.tc.testTime);
                        for (let i = 0; i < this.pRings.length; i++) {
                            const x = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            x.toString();
                        }
                        this.tc.end();
                    }
                }
                algebra.TestPRing = TestPRing;

                function getPFields() {
                    const pFields = [];
                    let i = 0;
                    for (let j = 0; j < small_primes.length; j++) {
                        const small_hex = small_primes[j].toString(16);
                        pFields[i] = new PField(small_hex);
                        i++;
                    }
                    for (let j = 0; j < safe_primes.length; j++) {
                        pFields[i] = new PField(safe_primes[j]);
                        i++;
                    }
                    return pFields;
                }
                class TestPField extends TestPRing {
                    constructor(tc) {
                        super(tc, "verificatum.algebra.PField", getPFields());
                    }
                    all() {
                        this.identities();
                        this.addition_commutativity();
                        this.addition_associativity();
                        this.multiplication_commutativity();
                        this.multiplication_associativity();
                        this.distributivity();
                        this.subtraction();
                        this.inversion();
                        this.conversion();
                        this.hex();
                    }
                }
                algebra.TestPField = TestPField;

                function test_PField(tc) {
                    (new TestPField(tc)).all();
                }
                algebra.test_PField = test_PField;

                function getPPRings() {
                    let tmp;
                    const smallPField = new PField(small_primes[0]);
                    const largePField = new PField(safe_primes[0]);
                    const smallFlatPPRing = new PPRing([smallPField, smallPField, smallPField]);
                    const largeFlatPPRing = new PPRing([largePField, largePField, largePField]);
                    tmp = new PPRing([smallPField, smallPField]);
                    tmp = new PPRing([smallPField, tmp]);
                    const smallCompPPRing = new PPRing([tmp, smallPField, smallPField]);
                    tmp = new PPRing([largePField, largePField]);
                    tmp = new PPRing([largePField, tmp]);
                    const largeCompPPRing = new PPRing([tmp, largePField, largePField]);
                    return [smallFlatPPRing, smallCompPPRing, largeFlatPPRing, largeCompPPRing];
                }
                class TestPPRing extends TestPRing {
                    constructor(tc) {
                        super(tc, "verificatum.algebra.PPRing", getPPRings());
                    }
                    projprodring() {
                        const endTime = this.tc.start([this.prefix + " (proj and prod ring)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime) && i < this.pRings.length) {
                            const pPRing = this.pRings[i];
                            const newPRings = [];
                            for (let j = 0; j < pPRing.getWidth(); j++) {
                                newPRings[j] = pPRing.project(j);
                            }
                            const newPPRing = new PPRing(newPRings);
                            if (!newPPRing.equals(pPRing)) {
                                const e = "Projecting to parts and taking product failed!";
                                this.tc.error(e);
                            }
                            i++;
                        }
                        this.tc.end();
                    }
                    projprodel() {
                        const endTime = this.tc.start([this.prefix + " (proj and prod element)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime) && i < this.pRings.length) {
                            const x = this.pRings[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const xs = [];
                            for (let j = 0; j < x.pRing.getWidth(); j++) {
                                xs[j] = x.project(j);
                            }
                            const y = this.pRings[i].prod(xs);
                            if (!y.equals(x)) {
                                const e = "Projecting to parts and taking product failed!";
                                this.tc.error(e);
                            }
                            i++;
                        }
                        this.tc.end();
                    }
                    all() {
                        this.identities();
                        this.addition_commutativity();
                        this.addition_associativity();
                        this.multiplication_commutativity();
                        this.multiplication_associativity();
                        this.distributivity();
                        this.subtraction();
                        this.conversion();
                        this.inversion();
                        this.projprodring();
                        this.projprodel();
                    }
                }
                algebra.TestPPRing = TestPPRing;

                function test_PPRing(tc) {
                    (new TestPPRing(tc)).all();
                }
                algebra.test_PPRing = test_PPRing;
                class TestPGroup {
                    constructor(tc, prefix, pGroups) {
                        this.tc = tc;
                        this.prefix = prefix;
                        this.pGroups = pGroups;
                    }
                    identities() {
                        const endTime = this.tc.start([this.prefix + " (identities)"], this.tc.testTime);
                        for (let i = 0; i < this.pGroups.length; i++) {
                            const ONE = this.pGroups[i].getONE();
                            if (!ONE.mul(ONE).equals(ONE)) {
                                this.tc.error("Ones don't multiply!");
                            }
                            if (!ONE.inv().equals(ONE)) {
                                this.tc.error("Ones don't invert!");
                            }
                        }
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            const ONE = this.pGroups[i].getONE();
                            // Operations with one.
                            const x = this.pGroups[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const y = this.pGroups[i].pRing.randomElement(this.tc.randomSource, this.tc.statDist);
                            let a = ONE.mul(x);
                            const b = x.mul(ONE);
                            if (!a.equals(x) || !b.equals(x)) {
                                const e = "Multiplication with one is not identity function!" +
                                    "\nx = " + x.toString() +
                                    "\n1 * x = " + a.toString() +
                                    "\nx * 1 = " + b.toString();
                                this.tc.error(e);
                            }
                            a = ONE.exp(y);
                            if (!a.equals(ONE)) {
                                const e = "Power of one is not one!" +
                                    "\ny = " + y.toString() +
                                    "\n1 ^ y = " + a.toString();
                                this.tc.error(e);
                            }
                            i = (i + 1) % this.pGroups.length;
                        }
                        this.tc.end();
                    }
                    multiplication_commutativity() {
                        const endTime = this.tc.start([this.prefix + " (multiplication commutativity)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            const x = this.pGroups[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const y = this.pGroups[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const a = x.mul(y);
                            const b = y.mul(x);
                            if (!a.equals(b)) {
                                const e = "Multiplication is not commutative!" +
                                    "\nx = " + x.toString() +
                                    "\ny = " + y.toString() +
                                    "\na = " + a.toString() +
                                    "\nb = " + b.toString();
                                this.tc.error(e);
                            }
                            i = (i + 1) % this.pGroups.length;
                        }
                        this.tc.end();
                    }
                    multiplication_associativity() {
                        const endTime = this.tc.start([this.prefix + " (multiplication associativity)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            const x = this.pGroups[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const y = this.pGroups[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const z = this.pGroups[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const a = (x.mul(y)).mul(z);
                            const b = x.mul(y.mul(z));
                            if (!a.equals(b)) {
                                const e = "Multiplication is not associative!" +
                                    "\nx = " + x.toString() +
                                    "\ny = " + y.toString() +
                                    "\nz = " + z.toString() +
                                    "\na = " + a.toString() +
                                    "\nb = " + b.toString() +
                                    "\ngroup = " + this.pGroups[i].toString();
                                this.tc.error(e);
                            }
                            i = (i + 1) % this.pGroups.length;
                        }
                        this.tc.end();
                    }
                    exp() {
                        const endTime = this.tc.start([this.prefix + " (exponentiation linearity)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            const x = this.pGroups[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const s = Math.max(this.pGroups[i].getElementOrder().bitLength() - 5, 1);
                            const e = Math.max(this.pGroups[i].getElementOrder().bitLength() + 6, 1);
                            let j = s;
                            while (!this.tc.done(endTime) && j < e) {
                                const y = new LI(j, this.tc.randomSource);
                                let k = s;
                                while (k < e) {
                                    const z = new LI(k, this.tc.randomSource);
                                    const a = x.exp(y);
                                    const b = x.exp(z);
                                    const c = x.exp(y.add(z));
                                    if (!a.mul(b).equals(c)) {
                                        const ee = "Exponentiation is not linear in exponent!" +
                                            "\nx = 0x" + x.toString() +
                                            "\ny = 0x" + y.toHexString() +
                                            "\nz = 0x" + z.toHexString() +
                                            "\na = 0x" + a.toString() +
                                            "\nb = 0x" + b.toString() +
                                            "\nc = 0x" + c.toString();
                                        this.tc.error(ee);
                                    }
                                    k++;
                                }
                                j++;
                            }
                            i = (i + 1) % this.pGroups.length;
                        }
                        this.tc.end();
                    }
                    inversion() {
                        const endTime = this.tc.start([this.prefix + " (inversion)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            const ONE = this.pGroups[i].getONE();
                            const x = this.pGroups[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const xinv = x.inv();
                            const a = x.mul(xinv);
                            if (!a.equals(ONE)) {
                                const e = "Inversion is not a multiplicative inverse!" +
                                    "\nx = " + x.toString() +
                                    "\nxinv = " + xinv.toString() +
                                    "\na = " + a.toString();
                                this.tc.error(e);
                            }
                            i = (i + 1) % this.pGroups.length;
                        }
                        this.tc.end();
                    }
                    conversion() {
                        const endTime = this.tc.start([this.prefix + " (conversion)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            const x = this.pGroups[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            const byteTree = x.toByteTree();
                            const y = this.pGroups[i].toElement(byteTree);
                            if (!y.equals(x)) {
                                const e = "Conversion to/from byte tree failed!" +
                                    "\nx = " + x.toString() +
                                    "\ny = " + y.toString();
                                this.tc.error(e);
                            }
                            i = (i + 1) % this.pGroups.length;
                        }
                        this.tc.end();
                    }
                    encoding() {
                        const endTime = this.tc.start([this.prefix + " (encoding)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            for (let j = 0; j < this.pGroups[i].encodeLength; j++) {
                                const bytes = this.tc.randomSource.getBytes(j);
                                const el = this.pGroups[i].encode(bytes, 0, bytes.length);
                                const decoded = [];
                                el.decode(decoded, 0);
                                if (!equalsArray(bytes, decoded)) {
                                    const e = "Encoding/decoding failed!" +
                                        "\nbytes = " +
                                        byteArrayToHex(bytes) +
                                        "\nbytes.length = " + bytes.length +
                                        "\ndecoded = " +
                                        byteArrayToHex(decoded) +
                                        "\ndecoded.length = " + decoded.length;
                                    this.tc.error(e);
                                }
                            }
                            i = (i + 1) % this.pGroups.length;
                        }
                        this.tc.end();
                    }
                    hex() {
                        this.tc.start([this.prefix + " (hex)"], this.tc.testTime);
                        for (let i = 0; i < this.pGroups.length; i++) {
                            const x = this.pGroups[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            x.toString();
                        }
                        this.tc.end();
                    }
                    marshal() {
                        this.tc.start([this.prefix + " (marshal)"], this.tc.testTime);
                        for (let i = 0; i < this.pGroups.length; i++) {
                            const bt = this.pGroups[i].marshal();
                            const pGroup = PGroupFactory.unmarshalPGroup(bt);
                            const hex = byteArrayToHex(bt.toByteArray());
                            const pGroupHex = PGroupFactory.unmarshalPGroup(hex);
                            if (!pGroup.equals(this.pGroups[i])) {
                                this.tc.error("Marshal/unmarshal failed for " + i +
                                    "th group: " +
                                    this.pGroups[i].toString());
                            } else if (!pGroupHex.equals(this.pGroups[i])) {
                                this.tc.error("Marshal/unmarshal failed from hex for " + i +
                                    "th group: " +
                                    this.pGroups[i].toString());
                            }
                        }
                        this.tc.end();
                    }
                }
                algebra.TestPGroup = TestPGroup;
                class TestModPGroup extends TestPGroup {
                    constructor(tc) {
                        super(tc, "verificatum.algebra.ModPGroup", ModPGroup.getPGroups());
                    }
                    fixed() {
                        let e;
                        const endTime = this.tc.start([this.prefix + " (fixed-basis exp)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            const x = this.pGroups[i].randomElement(this.tc.randomSource, this.tc.statDist);
                            for (let j = 1; j < 50; j++) {
                                x.fixed(j);
                                const y = this.pGroups[i].pRing.randomElement(this.tc.randomSource, this.tc.statDist);
                                const a = x.exp(y);
                                x.fixExp = null;
                                const b = x.exp(y);
                                if (!a.equals(b)) {
                                    e = "Fixed-basis exponentiation is wrong!" +
                                        "\nx = " + x.toString() +
                                        "\ny = " + y.toString(); +
                                    "\na = " + a.toString(); +
                                    "\nb = " + b.toString();
                                    this.tc.error(e);
                                }
                            }
                            i = (i + 1) % this.pGroups.length;
                        }
                        this.tc.end();
                    }
                    all() {
                        this.identities();
                        this.multiplication_commutativity();
                        this.multiplication_associativity();
                        this.exp();
                        this.fixed();
                        this.inversion();
                        this.conversion();
                        this.encoding();
                        this.hex();
                        this.marshal();
                    }
                }
                algebra.TestModPGroup = TestModPGroup;

                function test_ModPGroup(tc) {
                    (new TestModPGroup(tc)).all();
                }
                algebra.test_ModPGroup = test_ModPGroup;
                class TestECqPGroup extends TestPGroup {
                    constructor(tc) {
                        super(tc, "verificatum.algebra.ECqPGroup", ECqPGroup.getPGroups());
                    }
                    random() {
                        const endTime = this.tc.start([this.prefix + " (random element)"], this.tc.testTime);
                        let i = 9;
                        while (!this.tc.done(endTime)) {
                            const pGroup = this.pGroups[i];
                            const el = pGroup.randomElement(this.tc.randomSource, this.tc.statDist);
                            // Here we change the type of the integers from SLI to
                            // LI.
                            const x = new LI(el.value.x.sign, el.value.x.value);
                            const y = new LI(el.value.y.sign, el.value.y.value);
                            if (!pGroup.isOnCurve(x, y)) {
                                const e = "Random element generation failed!" +
                                    "\nx = " + x.toString() +
                                    "\ny = " + y.toString();
                                this.tc.error(e);
                            }
                            i = (i + 1) % this.pGroups.length;
                        }
                        this.tc.end();
                    }
                    squaring() {
                        const endTime = this.tc.start([this.prefix + " (squaring)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime)) {
                            const pGroup = this.pGroups[i];
                            const x = pGroup.randomElement(this.tc.randomSource, this.tc.statDist);
                            const y = pGroup.randomElement(this.tc.randomSource, this.tc.statDist);
                            // We essentially add at a random translated point to
                            // avoid the special formulas of squaring. We could in
                            // fact implement squaring like this.
                            const a = x.mul(y).mul(x).mul(y.inv());
                            const b = x.square();
                            if (!a.equals(b)) {
                                const e = "Squaring and multiplying are not consistent!" +
                                    "\nx = " + x.toString() +
                                    "\ny = " + y.toString() +
                                    "\na = " + a.toString() +
                                    "\nb = " + b.toString() +
                                    "\ngroup = " + this.pGroups[i].toString();
                                this.tc.error(e);
                            }
                            i = (i + 1) % this.pGroups.length;
                        }
                        this.tc.end();
                    }
                    all() {
                        this.random();
                        this.identities();
                        this.multiplication_commutativity();
                        this.multiplication_associativity();
                        this.squaring();
                        this.exp();
                        this.inversion();
                        this.conversion();
                        this.encoding();
                        this.hex();
                        this.marshal();
                    }
                }
                algebra.TestECqPGroup = TestECqPGroup;

                function test_ECqPGroup(tc) {
                    (new TestECqPGroup(tc)).all();
                }
                algebra.test_ECqPGroup = test_ECqPGroup;
                /**
                 * Generate groups of different structures for testing.
                 * @returns List of product groups.
                 */
                function getPPGroups() {
                    const smallPGroups = PGroupFactory.getSmallPGroups();
                    let tmp;
                    const pPGroups = [];
                    for (let j = 0; j < smallPGroups.length; j++) {
                        const flatPPGroup = new PPGroup([smallPGroups[j],
                            smallPGroups[j],
                            smallPGroups[j]
                        ]);
                        pPGroups.push(flatPPGroup);
                        tmp = new PPGroup([smallPGroups[j],
                            smallPGroups[j]
                        ]);
                        tmp = new PPGroup([smallPGroups[j],
                            tmp
                        ]);
                        const compPPGroup = new PPGroup([tmp,
                            smallPGroups[j],
                            smallPGroups[j]
                        ]);
                        pPGroups.push(compPPGroup);
                    }
                    return pPGroups;
                }
                class TestPPGroup extends TestPGroup {
                    constructor(tc) {
                        super(tc, "verificatum.algebra.PPGroup", getPPGroups());
                    }
                    projprodgroup() {
                        const endTime = this.tc.start([this.prefix + " (proj and prod group)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime) && i < this.pGroups.length) {
                            // this.pGroups[i] is a PPGroup.
                            const pPGroup = this.pGroups[i];
                            // We project to its parts.
                            const newPGroups = [];
                            for (let j = 0; j < pPGroup.getWidth(); j++) {
                                newPGroups[j] = pPGroup.project(j);
                            }
                            // Take the product of the parts.
                            const newPPGroup = new PPGroup(newPGroups);
                            // Verify that we recover the same product group.
                            if (!newPPGroup.equals(pPGroup)) {
                                const e = "Projecting to parts and taking product failed!";
                                this.tc.error(e);
                            }
                            i++;
                        }
                        this.tc.end();
                    }
                    projprodel() {
                        const endTime = this.tc.start([this.prefix + " (proj and prod element)"], this.tc.testTime);
                        let i = 0;
                        while (!this.tc.done(endTime) && i < this.pGroups.length) {
                            // this.pGroups[i] is a PPGroup.
                            const pPGroup = this.pGroups[i];
                            // x is a PPGroupElement.
                            const x = pPGroup.randomElement(this.tc.randomSource, this.tc.statDist);
                            const px = x;
                            // We project to each coordinate.
                            const xs = [];
                            for (let j = 0; j < pPGroup.getWidth(); j++) {
                                xs[j] = px.project(j);
                            }
                            // Take the product.
                            const y = pPGroup.prod(xs);
                            // Verify that we recover the element.
                            if (!y.equals(x)) {
                                const e = "Projecting to parts and taking product failed!";
                                this.tc.error(e);
                            }
                            i++;
                        }
                        this.tc.end();
                    }
                    all() {
                        this.identities();
                        this.multiplication_commutativity();
                        this.multiplication_associativity();
                        this.exp();
                        this.inversion();
                        this.conversion();
                        this.encoding();
                        this.marshal();
                        this.projprodgroup();
                        this.projprodel();
                    }
                }
                algebra.TestPPGroup = TestPPGroup;

                function test_PPGroup(tc) {
                    (new TestPPGroup(tc)).all();
                }
                algebra.test_PPGroup = test_PPGroup;

                function test_algebra(tc) {
                    const prefix = "verificatum/algebra/";
                    tc.startSet(prefix);
                    test_ByteTree(tc);
                    test_PField(tc);
                    test_PPRing(tc);
                    test_ModPGroup(tc);
                    test_ECqPGroup(tc);
                    test_PPGroup(tc);
                }
                algebra.test_algebra = test_algebra;
            })(algebra = test.algebra || (test.algebra = {}));
            let crypto;
            (function(crypto) {
                var ElGamal = verificatum.crypto.ElGamal;
                var ElGamalZKPoKWriteIn = verificatum.crypto.ElGamalZKPoKWriteIn;
                var ExpHom = verificatum.algebra.ExpHom;
                var PGroupFactory = verificatum.algebra.PGroupFactory;
                var PPGroup = verificatum.algebra.PPGroup;
                var PowProdHom = verificatum.algebra.PowProdHom;
                var SHA256 = verificatum.crypto.SHA256;
                var SchnorrProof = verificatum.crypto.SchnorrProof;
                var SigmaProofAnd = verificatum.crypto.SigmaProofAnd;
                var SigmaProofPara = verificatum.crypto.SigmaProofPara;
                var asciiToByteArray = verificatum.base.asciiToByteArray;
                var byteArrayToHex = verificatum.base.byteArrayToHex;
                crypto.input_output_SHA256 = [
                    ["", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
                    ["a", "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb"],
                    ["ab", "fb8e20fc2e4c3f248c60c39bd652f3c1347298bb977b8b4d5903b85055620603"],
                    ["abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
                    ["abcd", "88d4266fd4e6338d13b845fcf289579d209c897823b9217da3e161936f031589"],
                    ["abcde", "36bbe50ed96841d10443bcb670d6554f0a34b761be67ec9c4a8ad2c0c44ca42c"],
                    ["abcdef", "bef57ec7f53a6d40beb640a780a639c83bc29ac8a9816f1fc6c5c6dcd93c4721"],
                    ["abcdefg", "7d1a54127b222502f5b79b5fb0803061152a44f92b37e23c6527baf665d4da9a"],
                    ["abcdefgh", "9c56cc51b374c3ba189210d5b6d4bf57790d351c96c47c02190ecf1e430635ab"],
                    ["abcdefghi", "19cc02f26df43cc571bc9ed7b0c4d29224a3ec229529221725ef76d021c8326f"],
                    ["abcdefghij", "72399361da6a7754fec986dca5b7cbaf1c810a28ded4abaf56b2106d06cb78b0"],
                    ["abcdefghijk", "ca2f2069ea0c6e4658222e06f8dd639659cbb5e67cbbba6734bc334a3799bc68"],
                    ["abcdefghijkl", "d682ed4ca4d989c134ec94f1551e1ec580dd6d5a6ecde9f3d35e6e4a717fbde4"],
                    ["abcdefghijklm", "ff10304f1af23606ede1e2d8abcdc94c229047a61458d809d8bbd53ede1f6598"],
                    ["abcdefghijklmn", "0653c7e992d7aad40cb2635738b870e4c154afb346340d02c797d490dd52d5f9"],
                    ["abcdefghijklmno", "41c7760c50efde99bf574ed8fffc7a6dd3405d546d3da929b214c8945acf8a97"],
                    ["abcdefghijklmnop", "f39dac6cbaba535e2c207cd0cd8f154974223c848f727f98b3564cea569b41cf"],
                    ["abcdefghijklmnopq", "918a954ac4dfb54ac39f068d9868227f69ab39bc362e2c9b0083bf6a109d6ad7"],
                    ["abcdefghijklmnopqr", "2d1222692afaf56e95a8ab00879ed023a00db3e26fa14236e542748579285efa"],
                    ["abcdefghijklmnopqrs", "e250f886728b77ba63722c7e65fc73e203101a84281b32332fd67cc6a1ae3e22"],
                    ["abcdefghijklmnopqrst", "dd65eea0329dcb94b17187af9dff28c31a1d78026737a16af75979a1fa4618e5"],
                    ["abcdefghijklmnopqrstu", "25f62a5a3d414ec6e20907df7f367f2b72625aade552db64c07933f6044fc49a"],
                    ["abcdefghijklmnopqrstuv", "f69f9b70d1c9a5442258ca76f8b0a7a45fcb4e31c36141b6357ec591328b0624"],
                    ["abcdefghijklmnopqrstuvw", "7f07818e14d08944ce145629ca54332f5cfad148c590efbcb5c377f4d336e5f4"],
                    ["abcdefghijklmnopqrstuvwx", "93b0cabf8668e0c534c52a568957499e12a284f59d97dc9b2725ef836804875b"],
                    ["abcdefghijklmnopqrstuvwxy", "69b980549d5045969285133df773ae91ddd5d0e5c73dc8ee959b2eb223bc5fbb"],
                    ["abcdefghijklmnopqrstuvwxyz", "71c480df93d6ae2f1efad1447c66c9525e316218cf51fc8d9ed832f2daf18b73"],
                    ["abcdefghijklmnopqrstuvwxyzw", "d01472bd5be184ccf9c49ef6df8eeec8cad3ed2b45f9143466b1d53c0e9f1c43"],
                    ["abcdefghijklmnopqrstuvwxyzwA", "ca4f9d7952702a6c0feb93e06e58c5cf884d9455743768f3fb547fcd671dbe67"],
                    ["abcdefghijklmnopqrstuvwxyzwAB", "1f9ee915f7ed45d8dab7694431996ae5cc50272e8eda9fa566e3c4f7532ce5b5"],
                    ["abcdefghijklmnopqrstuvwxyzwABC", "63a1639029bad43797e99ce209030365e0a5c763dc9c4d6dfcf62fb45baae544"],
                    ["abcdefghijklmnopqrstuvwxyzwABCD", "1d2281bd5f5ab727df28b837832585dc3c75494298a9135cdd5eabc4c1874bec"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDE", "08157b90fe76b80c76acb91e1a96b08755723b4c0688c39d9561a5960d155a11"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEF", "262cbf8d1bcf25893032b632ffce206843f15278e03f94c194310b2c4900b664"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFG", "a85e3aadc3af9897000a13d5310bcd0e3b582a1ef2a6f54163ac0938082c6ffb"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGH", "d9993572e767a4d57118bdbf2af69d1c6f1d4cf03a731007bb1eec7bae5621e4"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHI", "7ea9c06952d078013a1ec47f98d5bb019d76e7ef31f746d4a5568836d970a11b"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJ", "5233c4f7c82cdb0d0c3905eefe3addd60af9b6a53273d93e43a2e33d487f7ba2"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJK", "27c2f1950e8ca6e88a6b24b245e2f291f1c7d6cc3ce845c5625edce71e5d9a3a"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKL", "7fcbea3112921c20a33728db86f98ce067bdf8f330bc2b5547b6e0fdbbf177ec"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLM", "0bb83990c75b6955f41d10715d72dec86fb8e9594bb61e4392ab62283d8e5046"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMN", "7eb6fa73c41a6ce5f8ec754a52151927177e0811bc2af60a206330219e25b1f7"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNO", "0eb255535e00a1aa5c82d39b60ed279ad91cbcf313f37bfe1708a729761dbda1"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOP", "5e7d4f28190c76b5f513056f27cc244fb3f4e0eec5cdaf811c26b7f026c20174"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQ", "ea0e5966bd9d2aac8e1779a7ef2d1dc4d19efa608f83f7375db74c12ec681e48"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQR", "7134720453833f47b69c357f10be1fddab2b7b5bf625f235e108686b253d45ca"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRS", "c16caf21f1851532556b7e51ecc88ea4377b8b3afaeffc521458d7da3d5e4deb"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRST", "409a1b09e9c54804380ebd6ad8d84e91834cf1b489b6f833adf93a70dc323056"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTU", "3815761859caaea26c3bed339f0e998d9931ed94049a2f3e9b49a6f2d1afc1e1"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUV", "6fb6f21e1946f655d2a5158493b8273de3c261629fc7769b235248fa852c1e73"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVW", "29bb690fc31cc8d19842b9a484d65c7360ce9e0d0a0a7bcec241d44fb1ecee69"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWX", "a1e75f3b974fea5b4de6a0f466534fa6f280962483b7198a055ce2ceeccb0611"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXY", "9d7e640624887affbcc536a92c194f9f10f394f47536d772b8424a87ca589ee5"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ", "04d1a0b4ceca3c39da7083e76b76b0d45fd4a691c45a548f8ff71268b621855f"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0", "25fbb647a30fa3efc5be95217653b7c17e98ac71e57ec774910f90da1d06fb90"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ01", "032638bc16cc5c1f1cddff1aad235dba3a0870f5e0a601c18d8288ee3bdae781"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ012", "3ca351c88a84aa9d31bcb961c6a2fd234a6af6bd58da92a7dcddc7a38d8b0e6f"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123", "3e49fbdb9882f248cdbe0f0d59ec401f41d00f755525a54ccd45468daeb19efc"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ01234", "c8629a0abb8ced1b052ef7cc9508597ed930daceb3081d7f7ed08d19324e65fa"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ012345", "3a8e8f746fc4bfc3ef8761c3626f1f017e18ea242fc78466427f6725fcd8d6e9"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456", "f6bf58f48daf2a0e288d571e56dd6ce985dc69bd4d1165acb5e15c4851d4a578"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ01234567", "0616bc70933498ad7c7d1f41c3c50730a37031a12994e4e92da4cedce7cb5132"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ012345678", "cdcc1268ada82ad226edb0f67fba5f43aafd65aa87df5c93a8384200f04e83d7"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", "a808c6c7af81169650b87fd073ee4885cfae00177abe302b86233b36f2f81dee"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789a", "83f8464e353f305a0ac8c900c72904e0816f7df62687cc917960444d6d56a52f"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ab", "b39f3812958a0002c5aa3e70b7623746f9ad488b9d7d62b492e9767523cb738a"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abc", "e76908998f2f8c4cb515650a377b758eb546dace331a2775249f5ea029905803"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcd", "4632ab207cbb85f951b737e7fa7dc72a81087fd6f4de17686b4266570f4b2e53"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcde", "3ea05d2f8d86ba43d87897647763a9f6c33cf08b8fd18892470e4d2c990e84e3"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdef", "09d30d9da141177278c3b1f889371d20fe5bb0ccac29b629f32f5fd1811e082f"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefg", "dc16e8a01a66637af7d8d6057a7ec0d1a808f9dfee277e15ec539aa1d1c5bdb0"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefgh", "cb393e3f01ecd6ca7156c7291185ba4686da090f0e1f53c0abc693f2ee180d7a"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghi", "450fcddead23ffa2e6a5e1be0d9a7e9d6b439da22daea2bc4540d0fe89204c64"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghij", "a4cdb8d31a67eeb12b50e8f84dc1a924f81b43e38df75c6c117d4c488315efb7"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijk", "2be815584d57865a84bf72a26dc7e195f53a9e6c50ef061fe9012d6a0b8eea72"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijkl", "484c820b40b812047863138bc68ba24834b4112c621978e20741d7c2f4a41d69"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklm", "05d33d1bf847f8a1e760bd08674e771bf84d78ab6d8d6c1906ca0610c255da2c"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmn", "f5c50838a7087bed62002351032bad895c650e55e4a688f82f315c52d223521f"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmno", "a0b91cb0e7bbbfac56de9c0605a4b8b92b0c602ecc0197419548d6343d3c9f57"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnop", "4e965a8e6296ce032c9f812ac239ca3a5a7b593a0c26b5774311db9f0cc098c1"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopq", "bf7bce0d75406d9538bec098363c34935748190348676ef30938bfcbe1bf2b16"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqr", "08cff4e9d0c680397d2b9e4525851d24e1d435b8eff86581679b664590e55ced"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrs", "4160d1e6fae6870959a7d016651dfe2db4a3129bb6bd19ae433dba2e8851b5db"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrst", "4df2ef9b719245c79ab612402d3054cabd6070ff38f9eadb6664f3765a19bf30"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstu", "80af5a5d180f46e1adca42fc27a58a5ec5e2c929713684e99064e987e4287478"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuv", "21fa852ca16b5db405b4825c271fc850fb5ef1d4910498f5eada5e7cd1cc3e08"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvw", "e737388b4820077bf53fcefeb94ff519a998d123558cd9f1081ecf1855f56aec"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwx", "f8c6c994661d87f2e754d6ed1fd8ce8d92f9e536e07185f38602a7b6b66f9644"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxy", "5467454d8e2a7f046d4d0985577a885e6700645475f649faa55267bb40102640"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz", "f89f139d945636e4a40d13535075f83c404bb5257e64ec10bc08f1873874459c"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzw", "8cffab2a8938f9c13bac4a3fca9c76f0efb890f8e5d55ed0eb7870a1e9d130c5"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwA", "0c95632b31a4a13a5d9570e3caec0d9e65ea5e7581c82fcd9adff821d81116a7"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwAB", "b5f65593bd0984d4f4a7d31728f294ae49083d852bfd16a82ac94870d66e4006"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABC", "a5982be527e8bd2776880961701ef2cf8379db2a59acb95d950ac860d8df0ba6"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCD", "91f4968f0fd10e7776805d22527124d60296ee57719eea6457995c14eb760218"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDE", "cfda8a46ddb8942a64878586c73ee6a5245e04a454930a563a807aff910cb9e9"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEF", "43ec6bd420f79a0cc5aa761d40aeae4099aa75ca1d68264050c543b35049c339"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFG", "5424556f1fac491e766a288edf404a58decd1086374457d8735427a3e0b574f8"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGH", "2091fabfbd4319f3757b4fac46342ed05f227e5d1cc041ebc61ff7678cd1411d"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHI", "c5a871bd38c72ecd5b06165001245c6cb168b2bdef4ac5d4442ffe4c482b431c"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJ", "205ceeff12ad2f9a32172476abbac5561844760f6beb462d80f96719e3dd70e3"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJK", "21dfd0ab4f8195fbde9cc64ba7705c6b9527fb03e6e7ad89ae3b046ccd620e08"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKL", "683e75c63e3ae94a1d2054f99b51c52eb422e395187811e19c2cb3574b981193"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLM", "0bd09cd79406855968c6afad2bb06a84aa33eacc1e72d4e71d0105c3f351f635"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMN", "6b1b6a818a25f73fdfd0526a3fd8fc1dd5999f708e799a7ab5653297a531fb83"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNO", "5af415eaf0a7e83a185718739ac940b840cf516c4053c42c4535c8b7a068eb8f"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOP", "57813bb5b88e5bbc949261ff799319209d78f1a7a5dd9f3476cf931cb1945079"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQ", "e54847db199a30b85fb9d286b8d44ec5761e3f76ea918ab1e5550e6abcd19969"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQR", "8a3ff62f5fd01f3b3e2e6fc8ecfe015b5299a2f9c6798513b34399712a2bbcce"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRS", "343ec596772bd8b68f4c4e3916f64103db2889c8b60462f84fe57403c84aba3b"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRST", "c619a4dc96eb91f1eb664f66371f7f4faf6b7e79031ca94199a9806be6e0ee0d"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTU", "17ebe2f7cb5c7e1ea503895a5c7cd54c34b9377acfbd75998a72544f9350ec1c"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUV", "f994c0d188c03d977cf998a08c61b56f2c978b629d80605d1f2271cbb7312777"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVW", "ee66bdb35bd9bdaa36242382756ed5bb09b01e6274af48a13a45b72f95c67e59"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWX", "223567a7a6f59caa5108b5ff2ffd39dcb510347b26b6f4e0eae937c99b86f568"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXY", "8e412e05c12e6d61eb0dfaedf8cc9dd189b8fa36537860cd96cd65586f6e4087"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ", "57676c4e02ed5b92086249fe34cf5bea75d2f47a1891463301217c73029e9a3c"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0", "85be7dd5f2c5cac3b219b8ab29818b75b77aae9a5a76bb96e7e7eafa682ebfde"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ01", "0e919eb981efd60243e191f8d61ecd5abd966a8a29c378972976ae4c76c51e24"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ012", "c05ffe926ff247279c8b899d10dbe4dab8fa05b6d9f75709ad60304b48711691"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123", "0821db910c8284f4e13e72afbb238b42544cda33d4c7b6e4e092e8d03ae84581"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ01234", "36e5a662bfeff510caca343fac3bfe87e114edafe499381547499d2eb0f68d14"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ012345", "1829878e2c13b52008815d22d83918dba652ce153b6aa10fd2433216591ec9b2"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456", "88d0f61916d0cd879cfb44f5bcb82c877141c539f431ed19f1925b5dfd2c27b6"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ01234567", "aed66e34e5d8a4992168d5f8c3183895e11d98636abe79a018fe0c172a0ff2d1"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ012345678", "eb21678942d6afedee67b091d12ebd13fecd00f2b9aaaf5343a7b738be28aa20"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", "6250bdcd59b0087a1a35e0fe0da70960b8539e878a4d1feb1da10bdcaf238eca"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789a", "69697b43454cdd7fdeb2dde9ba2530163f8a757b8e9289bd8c281c5c1dbea4fc"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ab", "539a980f92a836cfcdd9b191c9173cd389c67695df6595bf505bb2801bbb2c28"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abc", "80c7f576e0f2a46f106726c5f3ee9001b9992da0962382fd562a31c8dc737fce"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcd", "3aad4f6ab1898e0db7841c35fdcfd9bdb27f7af6822297792ac4eec67e80e282"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcde", "a7f221c79dc567e1ef2cfb6ae75de52e65652a6d33d971a1f6d31eb93c4ea97e"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdef", "30e13be5507408a58dd0dc0cef28cc06f2d76409bb027c61fcbf7bb13723a2a3"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefg", "9a9dad30f0f39918d828b6a8b71702f252f09dc260b86851a8afcf0f3169e489"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefgh", "87d8306acd46635708f7066d4f117d8b7468453769d30d829766e1e8af5e70bd"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghi", "2c3542ee1ebac610b2710364e9aa1dfc74be1f0f949475f19ef37197e169bf7d"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghij", "958e42905204f35824ca375066e80d00f64fc1877c432614fd75868be6896ef2"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijk", "46c060f4d70ad1a0fd9e0a9c7a831fa0dcb4d270c859569faf36944ced0891e0"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijkl", "a1e416848276b546d98a7fe45814aaa241bcf50eb0e4e54b7881f11b2ba7ce25"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklm", "b5a111fc6147dfa86915e4e15adb5ffd6416c9f797c5a7f550118b81e968b44f"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmn", "bcee40bd89f36933948b5dddac5a328b8bd5005a2df1eaacf13cedad888b7dde"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmno", "7a3b26908be45c72a68c98b1c5492306f9f36e0087f2ea3b2a109cfb3f6e9081"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnop", "e099dcfae3b75dd2be0c1fe0a7cade10f2a5dc9bf271ec863b742b60b63729f7"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopq", "b7ca9b0ae01c1f8da42ce9bc1d7e8370f1fc261bc42fccff213151c052aa72bd"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqr", "71b602cf97a2ff075fa13449c7b22c503e1b429eb31b94f6d08360d3b6a818ae"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrs", "9817cf4f545889d87234176594777673a3fab7a4dd0729f65b5f0c392cfae4de"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrst", "9f6e6d02541328e4c387360890e0efe0fc94d0228f8cf41135b29b5800d1d13b"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstu", "724eeabff4c8a1a1d4a2dbb23da04f6e92260740b2712b2234fc6f2a9bde1e70"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuv", "abfa84aa347f6c4d4f6abcbd91dbbf7bce768cc9a8ee47279283790db02c69cc"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvw", "7f32e4a4649fb38e3a79442030718028dd064317b953d0ffbd0674a1fdef6503"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwx", "4c343494f829efa5ac08bcb519dcf374e963ba32a4aeca43e7a5e29657612895"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxy", "ef3ed730cecbb030b4acb68adcea622bc7d8e77af5a5d8a7ed9979055b1bfd0f"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz", "a6699f2d9e5aeab592a56061e77ff07c80685f7880e074c7edef0e1d5b596e77"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzw", "104ce484013e6e3868f16875367173c6fdf86f5397d2e30f8ac930df819c0bb0"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwA", "ed2d8912fb8f2e31e932bb4edfc588450e5493cee1c6b6830043cb53ba57ca5c"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwAB", "36ce6414cfdd6fd958b3543f3736f38b40253d3bcf33034f80f26edbb3b96fd8"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABC", "4026a794c6be15bd7cb6b0110fe9cb9242de940c9af00a2a4900fde7419877b9"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCD", "d4bfbae1cd3e3afb1185986f43555c8112640c64035fa9e1befa31a1f37d186a"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDE", "e7582940018f13479a3e968dcc4da1d7ecc00a234b2a8eec3b849729f63711a5"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEF", "ca05c1d3569dd3a4bf8bd7fe5591390b9958d7eb1bd46f8230a4ad061b51ca94"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFG", "76c2cd482945151751e2e6d6f1d2fcc0bd5246d4b688c00dcd811875ed197356"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGH", "5d292d7d9325e981068fff3dd01d3cccbd30cbf4e30008fa7c03da6362bceb8f"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHI", "7baa347eada3d243b785702f4e47c6fd1d071c563d56faa6a059f1f7e6cdeef3"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJ", "9fa95314d5a84deb8f986f6ccafef41294a27eeea084e56ac2fad3fa42373de3"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJK", "849beeb5f12c9c5b14a7c89fba739541d37794b960f19b5d4ef404c57efdc824"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKL", "9cb6bcff8576e9d5cec78fcd00113e0318c8b5d72216a4b96fbb32a4ad4f1d90"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLM", "c4887a9ce01d9cc1ecb5cd3c3681dde835e543282ecf6e15eb8dea41edef435d"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMN", "84c4bf5d9128ba5e2fc54c3d202c53a4240fa47f4111e61e76a1d6a5dd8fdba0"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNO", "91c4af941342c5cc8d43b8756340fee30c43ebba605531fb5b52b36108e4af57"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOP", "3647316e56b61f8e7c8416e8870ea7cd3b58114013d517db32f25366fbc598b9"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQ", "df8f4be3edbe0d0a7fd4703ba5810ce4d1bfb156a6aaf196fbc695f58aba67ee"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQR", "f165e52c2c9a90edf24d5c306d2ecb52747c1d49bd2b1ef88ba86ab641ebdab5"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRS", "59b1a5451bdf477207050fd4b6146391ea40284c611f9c4b6d9a8e96470c244e"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRST", "592bfcc7c0633df60c783196730411f0edcc04fe5a1243001363204e53e7cbc1"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTU", "bbf46977bf1fb12ad44da16552e309cd1ffb5cdf72026b1dc6309b8ec5bccc7f"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUV", "55ec87435e13fd74d2e1cfb4909842ea105f91d5304b1ae998521264c5c9d563"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVW", "8d8c629a038b8c1e6a8b1d102842406133950977a2b6113cbe86683c35376257"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWX", "21bbf3bc922ac2d94fc80636fc58f00d373d76f17c715695b6ef0805a522ca37"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXY", "109d3b6d6debe977610a4fe8267c19a37a4517cc35e284804defa1792ecfcb26"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ", "c9f1300d1b4d081d531b9cf9f067f3c0d6dfa77186d6743f1ce58dda39329cb6"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0", "dca91401c35d2b7f14c164905fa9e2e4dc5d9c4a209883a22ae0352eef70d5af"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ01", "860e647e323928435f209ec603c5b17eab87a8cc7a0b5b8bd22d3f5adb3c4825"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ012", "018d63e5655b5fcecdbc3978e9e898debbeaef6ca5f3b646c8bbddcb0955d9ce"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123", "2946d79d2b3d44cc0f975ef292ce6f5bda69cefe164bb943f633a27718e288bc"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ01234", "aa9fbdb6ff54aec66f0ee7ac3c3224bbca53732fe7b75477cc38da39d63b8f66"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ012345", "3395cd7a71086f037e5d6f98c28cb34dee973a417398f8a66fc1c645ee954517"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456", "00bdeafe83c4ffbf173c44f4c2e893eb2d464d4c0f8b5ca7a90865e39af4a0e8"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ01234567", "02d8639bed44327f0833e5b00eec69a83ac3a9002620345ccc30f4bb10106ba2"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ012345678", "f0b6bc28b70c0aa80e1ae30884f757c9685cacb4f6d0dc8ff5cc3faa55627a51"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", "f704614cadeefcb98e7207c7399d67070673aee7fda80b88edb6521057285a89"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789a", "cb821a2be983dedf2add7c8fac7a399a80839694b434f7cd0ad2a0884859c275"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ab", "074a96cc6e41482df5629024fdc4a0cebeeb75227359ba1eaeeefa21c3c53dd3"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abc", "b0916a7edf73f50877c0b58b9a4acfaa90ec2aa8770433d5f4298b893f30990b"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcd", "2d092c54172d6baa578a6425170d9551ae038ada8b3aa01cd45ef8070c27daae"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcde", "40003b959db10b78b4bd84c09d0700aea7d91ca74fda653a0fe842e87dc951e7"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdef", "05f285358823aafeb77f303a0dc13cf13d4234b106d5c12cf7de840a2a4527eb"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefg", "2297eebab18c97f93537512e3ec6d1607297f4bce662324c2430beb40cdbfaa1"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefgh", "755fde40e7e9c41aa0d4be7fa9a54b927bda765fef143f23556b7467017c8403"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghi", "f102df38581780403891982e2aee58791d5802785c4a42a3d193e170eb687d19"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghij", "46fc61c5cbeca5b22c9093d5ac74874abe1c3313cc352fe8c5856190c281c48c"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijk", "099dfd8137f5aa35984703616f2beaed3516166541d4022150d6814424e620c5"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijkl", "f2884104f78d9bf7bb8a3d8ccd267d3e858c19f563b296aaf82a3d7252d5dfb0"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklm", "4491b09b1c29fd13286f39540c699287de8c3eb97be931661c072671e8e09ff9"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmn", "eeb668a9f14e1900425d973eb0d2d9c4f81b5c61fdb3e8677d9900dd857c76c3"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmno", "5218eece33a1568293f9e0c5d0e2ac0a903893a327a6554a297d7cd82bb4a95d"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnop", "b8c77fe296ccd8252e633ec2583bb1fff00d030658727fce3b1f4a4a4061e845"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopq", "589819586048cd1f289328a9730e88151a716c15a686457b1b97922d73084736"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqr", "e153dd1f382be89178be99710dfad8e9a2d732881480dc48d27a40b985fa23b0"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrs", "33cd085cbfd8c19778583f6001f6d6c129cb1dd3da4fc8334de60bfdc996c5c0"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrst", "79e04aeaca11734737ceae95e96431b15cc6d3fe07674e30ae088625fcc1ab0e"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstu", "f8d6a9aab789e6147a0ada66eb6a413b6102c9c74b99637596b1836698fc4bd4"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuv", "e519e5f1132d4f8e0d44256e45a4b2f9ca71bfe36c9b974ed68de6870eb32832"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvw", "5eb255dbd3bda7adbb40306e65671ac4a5568bff886c41bc4d08b235deb644a2"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwx", "4e8f0c3fdc719b0335e9eec0cd8c8bf99bd955df968fb590abeccc6bea2594c5"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxy", "96530963b36fe776b933f112482b0ebce16f52522e48dba243eb6fdc6c211727"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz", "25b59b806e95d4aaf0e6f2798aad8bc3b2c426010cd439c86de2bc34ca435073"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzw", "466d43b4e5eee41cf6f2c455262a439dede1dcf69389f3251c82dde19955d0e9"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwA", "af352fe7d21f2e278046b9ccd458e103fb88eb95f564d6ebf3f5d55ff08d1e3d"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwAB", "4acbd385165d64dfda8c0acb19d5d3f5f17c3712b2ad354120ddf018b7646699"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABC", "e2d673998779986e209603335b702339e89e996aec982463c5504fbb3030f6e6"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCD", "fe5196f73880dbef5569bbcd2a5129bc501508a2ce735d27fd576affa1f9097c"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDE", "c8d6badfd43bf0d9d3a0824f0d73f388cbfacfc2b1217b5da7702908b764218e"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEF", "ac6273c6302df9fc0c3fc1773be35f908e872b721d993bde981086786493aac2"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFG", "b71d7c9929b6b61da832b7d15d291bb025f12662082c798c9cb6dab46385032b"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGH", "a1dc41b1246e2c18af438d0af048125d24d16f96bcf482c7d28ff17a7a92f93f"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHI", "4f8befbf91d19b514f7a7ba54c17f4453a8381dee3838b173a5516d3a92758ce"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJ", "e0f2bc42c0ae40f2f357ede315e3250ab43cb0e165b63757a8eb680dda47cde5"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJK", "c95e3ed0e55b4658a58350be0ae1b3960413615e20fc216b1076238e2b262184"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKL", "216a82307a3dd8fada85ad33996d4b201a25d2548f9db0fcfca5aa960b6074e9"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLM", "7fb628d5df02321d94727218e04a79b6333c3e3a612687acba7964098c660899"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMN", "c68e5020631720afc5669a8e09229517c5aa55ea347410e6f8e64b96f2fbba92"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNO", "58031a7b05d963344587ab62dbed0d179d771721dafca68aeb720e3d005654f7"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOP", "61424a677698b3d184ea346396d20dee19ed56109de8cd4e58ef379c3ef4306a"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQ", "35f9164060bcec18937a869515c2939cb1f3cd96eb0e23e7ae4c8e77a63ca260"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQR", "784c59a54b50441316cf7cba49ad503546e432ac31ce7819e08ac6054cfffbe7"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRS", "7bd73736c1e021c6ad58a257785c98a0c2b4283e001fcb3729956b8a8eff5c6e"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRST", "b117dc78d64cc188fa5cc739ff5cf7b5aabb09db660ae44523146908cb974c55"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTU", "6773b0a7b85d6bc173bd6903b464b5866018bf742f65dc2d4d785de115e1f50d"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUV", "d112f849878c0699d5a3749d312997d57e9e38067eadd175919d4bffedb6895d"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVW", "ab8cb785f48552b39369dd7b83a8e900eccf8bc7ab24edd5e8cdf0a29129b096"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWX", "a4e32012825ae5e0e8b649ff0a58c9485151121e579bc3e2edd050b4a4338acc"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXY", "099826a69fae21991a428014190b7da26b837c9018b8e298d220f7904c87ca8d"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ", "47f837f9c884dfdbf93a45c38c0603fe92ee50f04b3d2ffbfd58ccd2ad2bc97a"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0", "35352863543913ded0aeeb9c05a97fa4a9c040a78bc673b6e5fd621a3789580e"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ01", "4f2ccdb15a434844ec5cd8ef72943d78686cd1502b663ec214c09a7c34bb2495"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ012", "a9d837dd138258099edba1ecf2dcb481a7c9414815e363fe635585bfa3232e6e"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123", "e8d884a54608a878bf69dbf397957e01af5bd60fc9040cdd2e6a1d31d88a5ff2"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ01234", "bde93eb8ad0139f082c2ab1a6576b31a779464991ece500ded852f3ac4b83d85"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ012345", "ca04e4b023113f61697f08ecefaab63c9f26f3864ccdcd29f1d9fa3eb952097c"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456", "ad944ddee43abee50d8aab0e25b3028f320fc60ebdd0f04a03541e7d892f1ba9"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ01234567", "2c41bb84b784b8526a75e310d478228431257a091f18dc8800bd9cdc450fdc5f"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ012345678", "5d55abe136598b8c7cce5a8cc581f2beb2a15f1f51929fd92997274500b98b10"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", "e693e17d313e7d75feb8c8c11eab8440e42c0b4e338165a9233a0902b78fdeaf"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789a", "ca79672ecd82f58b5ba40836304b4d6ca6b2be2dfdabf155138edc248b6ddea9"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ab", "214c74a4c7e9665c87f71d5bedb013404a5d4f163cc154528ec70033c1c11ef3"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abc", "7da4c63b8a2c6bbe12ada3c2433b05e1150a8e21a27818b3563cc72e066d2b14"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcd", "bffef723f59fc6bc53fff0c359e374accefc63127338abbd4e5d2d00af324299"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcde", "dbd190ace4b112d6d8b792d86103454569b5e896c1f68401b4bc982dbc6fa009"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdef", "776bce4b535da7d91a01c5a2844cf4d98d37385e434d94859a78dce7846b795d"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefg", "65ed7a34a3b2d21cab844ac20a2bde9ebf428426d67dc4e242fbc930f38bd62c"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefgh", "58e30893835e92f621418b2b69e4241eb7b70c759e7646ac99c81310833d2248"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghi", "6d107aa83e558b5d6e46469e6b5a6b23ede28f6398c244017fec785e3df2f133"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghij", "093492133ae42d43a8d2effa6f70664fe873f765ac1440c6ff04513b0235f906"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijk", "091fcaa4fe405c0fb5b9fb9b6ea93bd2ee95fb2c791fd4772d6bc660b778a56c"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijkl", "49f31faefc9977550564ba634abe1adfaf10134df3ddf64fca34350f54ecf425"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklm", "6ad6a9e6943382eccb11275e7693fa034187a714768d40b9c0ffac232fa76fa1"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmn", "86b908c01de08ddfd29a792c959ef521b282dac481612ecfae9d5b2971ca55b4"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmno", "897921111835e65ba6e8f4524149e2a1e98727c5c37b02d0bd9bf27c47461367"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnop", "8ea3f5126c27df2af1218b0c9a22277f8a510f2577a933f4bec5b39017b7b0bd"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopq", "970296f65a267e802363e6377a51b335be4a8596857e34198b38f603f400fa80"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqr", "5d6361f0d5a8627e777dd8e5950754b6d628c3e0d22c5242eb9c731367ef4631"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrs", "63c7642ff1e3453e446a1de070f40b2ad46596bbf08fe3b8644240d19e477dab"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrst", "86d014513bb9637b311a4e9d0b392abaffb3e61c8c39ffbadff980485d840de3"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstu", "4f570406b869d9319aa396e9c91b914259479982299c2fab53522cef2ac70834"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuv", "626423f720cab6fc970cf8fd928e16ed8f8a2bca1936cab09aab474d45ed1235"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvw", "abdbd3eaff53b51772ca0ea4defa5936012aa0f5a2dfe17e5d92eca65d5e8783"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwx", "989132d368315a913a7b0f4edc7a5d077171560f8706f5586e810bf3ed32fc29"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxy", "5fe8551615d7732e43655b4762f26578b51c7faa50a8b3be269ac4dba8c4fb96"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz", "4b88f72caadfb3d03e389c71ab03a9730d712053f93573aa67e1106c172b127e"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzw", "41458b33a6c87ca076faefe7f85126fad54e95be6421b2408e07242346d5562e"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwA", "46450785e6a1505bcf9c6a4c6734063a161ac184b6ab6d638656a6d8c15b8595"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwAB", "d54cafd1631896aaace7c8c33a9ce0e832003b5941899579714a5d98346f6734"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABC", "1a3d83b61afde334e9ed526e1cb959ce525aef81904fd92aa6fadb9cc02786ba"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCD", "afbfc11f505e489d542f66a172976072e6d661d3d21e6cbecbf8f6c5251ed91a"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDE", "b55c464dcf51f2a7ee4017ba3dfc7760bb852a8c5c6b2a86130f646b13553028"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEF", "3b5a66a3cd54247498517e0bea3adaf533529885174e7c228889a27b0cbb32d8"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFG", "33f862db77ecc1242c440f80a73e4753ebe0a950c63aeb50fdb1bc6915b5663e"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGH", "fc80a93ab7cb37e07e28f4fefcc8453243227d1780dff94934c0f3452875edad"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHI", "2b13938bfa214dfee3cb303a4ab021555a544c891e6631bf4b17c792c836a8e7"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJ", "253f12f81748cb8f5d2846565a13596d00603b8103a1ebc7c6dc3da64fd382b2"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJK", "df47da339c3e5d8cf98d69c4aa8be27505100d1b6766e6947c304e7634620862"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKL", "a63907b73bfa37faa7108ec5d6dbfc0bfec0eb263f66acd76788590fcc30ca05"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLM", "8ed4bf6dc1bd3764ce04ce95285466aa2bd8a1122386770f51ade6a67f6f01ec"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMN", "5569900fc9f705cbf5b27946a8c0e8279a2472b49072c8b9634e440d39d70f05"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNO", "3851eaca864ee76482c4ed6f0b6eb8f90176162c442dbaab003b3f4b2aa84ddb"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOP", "f0e25f6c0ad15baaef63afd5c57b334d19e3a3af7d893628c710bea59dd8617d"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQ", "3470d608cf11d9fe44d0bfc1a0b3a2514b74f04d05936fdd80dcf5f03755561e"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQR", "bbcc4f13c5ca6ac2a5d2f15e831f9bed06d1d7f9a4fd5d213d09a64203680405"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRS", "df8b8b159676a699533a161696a4689874ffaa6ae5aa61db515d61ef74b14466"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRST", "72c6ba11f9041344ab437466ec7d90d8ffa67324c855b53434ae2f63668fd9cf"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTU", "9a8ef186f4e05398e4415396cee6c71fb6beff156ef7ddb22b137f5e967c02d9"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUV", "995bd7862f5be36d6cbfc968aebf1be0aac10900ab174c5206051a4099b66147"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVW", "e6d58ca3b795cda7a10b488505ff99505c1f02dd5fabfcbd214c3cee6aec6dc5"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWX", "ed8aee444534f124cb4fdec06e61893ac4a95457c33282d1eada984c65d5ae64"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXY", "b4c37ff73d1d03c9e4ce487c09ab794715bdfa0c7e57c1158a3210d1c47eb3f1"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ", "732258c19bddcbb6468b93ec17ad071b42f01353536f102c3c47266d8e405295"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0", "5a5664d40c5506dae9be56f31456f2fe06781b6853dbaf97fa4853b369068f4f"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ01", "63f1b00640c8d804e50291e03dba57b2ec115acf808ca3a4f31cd8fdbd791f89"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ012", "1dd7cb57c7c021dd0bd2430b15155285eacd2b4bb3b2a76e36cbcdeedb8c5bc8"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123", "73e444726500a61020c87298d44b870e58a2df33b457289c9ab7ad1445d2342f"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ01234", "b109593085765600df9e2350673c9496adeba5dba962ef8efa9b1090d3cfa8bd"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ012345", "ec657596e7fd74a5ae98c5485e881370b347c742eeb9e26dfbf6304114b4d535"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456", "c92a5bfc91bd19647754150d4f245f7c4cff72935e936eedfb1d5f17268fb7b5"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ01234567", "eaba268ce734bf5fdbdacd206cc7e2067fd8f0c1d256c92ba9c3277c0bd63759"],
                    ["abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzwABCDEFGHIJKLMNOPQRSTUVWXYZ012345678", "fd3324a6d01bce72018453699d2971dc18b5361f5ec752ab8d422a08c2f9e2b2"],
                ];
                const input_output_SHA256_NIST = [
                    ["abc",
                        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
                    ],
                    ["abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
                        "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"
                    ]
                ];

                function test_input_output(tc, pairs) {
                    const hashfunction = new SHA256();
                    for (let i = 0; i < pairs.length; i++) {
                        const pair = pairs[i];
                        const bytes = asciiToByteArray(pair[0]);
                        const md = hashfunction.hash(bytes);
                        const mds = byteArrayToHex(md);
                        if (mds !== pair[1]) {
                            const e = "Input: " + pair[0] +
                                "\n" + mds +
                                "\n!= " + pair[1];
                            tc.error(e);
                        }
                    }
                }
                /* Informal testing of the naive SHA256 implementation. This does not
                 * replace formal verification, but gives decent coverage when the
                 * list of input/output pairs is large enough.
                 */
                function test_SHA256(tc) {
                    const prefix = "verificatum.crypto.SHA256";
                    tc.start([prefix + " (SHA-256)"], tc.testTime);
                    test_input_output(tc, input_output_SHA256_NIST);
                    test_input_output(tc, crypto.input_output_SHA256);
                    tc.end();
                }
                crypto.test_SHA256 = test_SHA256;

                function test_SchnorrProof(tc) {
                    const prefix = "verificatum.crypto.SchnorrProof";
                    const pGroups = PGroupFactory.getSmallPGroups();
                    const sha256 = new SHA256();
                    const endTime = tc.start([prefix + " (prove and verify)"], tc.testTime);
                    while (!tc.done(endTime)) {
                        for (let i = 0; !tc.done(endTime) && i < pGroups.length; i++) {
                            const pGroup = pGroups[i];
                            const g = pGroup.randomElement(tc.randomSource, tc.statDist);
                            let eh;
                            let sp;
                            let witness;
                            let instance;
                            // eh(x) = g^x (plain exponentiation)
                            eh = new ExpHom(pGroup.pRing, g);
                            sp = new SchnorrProof(eh);
                            witness = eh.domain.randomElement(tc.randomSource, tc.statDist);
                            instance = eh.eva(witness);
                            test_SigmaProof(sp, instance, witness, sha256, tc);
                            // pPGroup = pGroup x pGroup
                            const pPGroup = new PPGroup([pGroup, pGroup]);
                            // b = (c, d)
                            const t = pGroup.pRing.randomElement(tc.randomSource, tc.statDist);
                            const c = g.exp(t);
                            const s = pGroup.pRing.randomElement(tc.randomSource, tc.statDist);
                            const d = g.exp(s);
                            const b = pPGroup.prod([c, d]);
                            // eh(x) = (c^x, d^x) (equality of exponents)
                            eh = new ExpHom(pGroup.pRing, b);
                            sp = new SchnorrProof(eh);
                            witness = eh.domain.randomElement(tc.randomSource, tc.statDist);
                            instance = eh.eva(witness);
                            test_SigmaProof(sp, instance, witness, sha256, tc);
                        }
                    }
                    tc.end();
                }
                crypto.test_SchnorrProof = test_SchnorrProof;

                function test_SigmaProof(sp, instance, witness, hashfunction, tc) {
                    let e;
                    // Verify that honestly computed proofs validate and that
                    // slightly modified proofs do not.
                    for (let j = 0; j < 5; j++) {
                        const label = tc.randomSource.getBytes(j);
                        const proof = sp.prove(label, instance, witness, hashfunction, tc.randomSource, tc.statDist);
                        if (!sp.verify(label, instance, hashfunction, proof)) {
                            e = "Valid proof was rejected!" +
                                "\nlabel = " + byteArrayToHex(label) +
                                "\nwitness = " + witness.toString() +
                                "\ninstance = " + instance.toString() +
                                "\nproof = " + byteArrayToHex(proof.toByteArray());
                            tc.error(e);
                            return false;
                        }
                        // We can verify various bit errors and make sure that the
                        // proof fails as a sanity check as below, but this does not
                        // guarantee anything.
                        //
                        // Single bit error at any point should give a false proof.
                        // for (var l: size_t = 0; l < proof.length; l++) {
                        //     for (var b: size_t = 1; b < (1 << 8); b <<= 1) {
                        //         // Introduce random single-bit errors in each byte.
                        //         var modproof = proof.slice();
                        //     modproof[l] ^= b;
                        //         if (sp.verify(label, instance, hashfunction, modproof)) {
                        //             e = "Invalid proof was accepted!"
                        //                 + "\nlabel = " + byteArrayToHex(label)
                        //                 + "\nwitness = " + witness.toString()
                        //                 + "\ninstance = " + instance.toString()
                        //                 + "\nproof = " + byteArrayToHex(proof);
                        //                 + "\nmodproof = " + byteArrayToHex(modproof);
                        //             tc.error(e);
                        //             return false;
                        //         }
                        //     }
                        // }
                    }
                    return true;
                }
                crypto.test_SigmaProof = test_SigmaProof;

                function test_SigmaProofPara(tc) {
                    const pGroups = PGroupFactory.getSmallPGroups();
                    const sha256 = new SHA256();
                    const prefix = "verificatum.crypto.SigmaProofPara";
                    const endTime = tc.start([prefix + " (prove and verify)"], tc.testTime);
                    while (!tc.done(endTime)) {
                        for (let i = 0; !tc.done(endTime) && i < pGroups.length; i++) {
                            const pGroup = pGroups[i];
                            // eh(x) = h^x for different h and x
                            const sps = [];
                            const h = [];
                            const witnesses = [];
                            const instances = [];
                            const ehs = [];
                            for (let j = 0; j < 4; j++) {
                                // instances[j] = h[j]^witnesses[j]
                                h[j] = pGroup.randomElement(tc.randomSource, tc.statDist);
                                ehs[j] = new ExpHom(pGroup.pRing, h[j]);
                                witnesses[j] = ehs[j].domain.randomElement(tc.randomSource, tc.statDist);
                                instances[j] = ehs[j].eva(witnesses[j]);
                                sps[j] = new SchnorrProof(ehs[j]);
                            }
                            const sp = new SigmaProofPara(sps);
                            test_SigmaProof(sp, instances, witnesses, sha256, tc);
                        }
                    }
                    tc.end();
                }
                crypto.test_SigmaProofPara = test_SigmaProofPara;

                function test_SigmaProofAnd(tc) {
                    const pGroups = PGroupFactory.getSmallPGroups();
                    const sha256 = new SHA256();
                    const prefix = "verificatum.crypto.SigmaProofAnd";
                    const endTime = tc.start([prefix + " (prove and verify)"], tc.testTime);
                    while (!tc.done(endTime)) {
                        for (let i = 0; !tc.done(endTime) && i < pGroups.length; i++) {
                            const pGroup = pGroups[i];
                            const pRing = pGroup.pRing;
                            const pPGroup = new PPGroup([pGroup, pGroup]);
                            const pPRing = pPGroup.pRing;
                            const g = pGroup.randomElement(tc.randomSource, tc.statDist);
                            let z = pRing.getZERO();
                            while (!z.invertible()) {
                                z = pRing.randomElement(tc.randomSource, tc.statDist);
                            }
                            const h = g.exp(z);
                            // Chaum van Heijst Pfitzmann hash function with a trapdoor z.
                            const pph = new PowProdHom(pPRing, [g, h]);
                            // Distinct inputs that give the same output.
                            const x = pRing.randomElement(tc.randomSource, tc.statDist);
                            const y = pRing.randomElement(tc.randomSource, tc.statDist);
                            const s = x.add(y.mul(z));
                            const xp = pRing.randomElement(tc.randomSource, tc.statDist);
                            const yp = s.sub(xp).mul(z.inv());
                            const witness1 = pPRing.prod([x, y]);
                            const witness2 = pPRing.prod([xp, yp]);
                            const sp1 = new SchnorrProof(pph);
                            const sp2 = new SchnorrProof(pph);
                            const sp = new SigmaProofAnd([sp1, sp2]);
                            const witnesses = [witness1, witness2];
                            const instance1 = pph.eva(witness1);
                            const instance2 = pph.eva(witness2);
                            if (!instance1.equals(instance2)) {
                                tc.error("Flawed alternative witnesses! " +
                                    "(Bug in testing code.)");
                            }
                            test_SigmaProof(sp, [instance1], witnesses, sha256, tc);
                        }
                    }
                    tc.end();
                }
                crypto.test_SigmaProofAnd = test_SigmaProofAnd;

                function test_ElGamal(tc) {
                    const prefix = "verificatum.crypto.ElGamal";
                    const endTime = tc.start([prefix + " (encrypt and decrypt)"], tc.testTime);
                    const pGroups = PGroupFactory.getSmallPGroups();
                    const maxKeyWidth = 3;
                    const maxWidth = 4;
                    let i = 0;
                    while (!tc.done(endTime)) {
                        let keyWidth = 1;
                        while (keyWidth <= maxKeyWidth) {
                            const yGroup = PPGroup.getWideGroup(pGroups[i], keyWidth);
                            for (let l = 0; l < 2; l++) {
                                const eg = new ElGamal(l === 0, yGroup, tc.randomSource, tc.statDist);
                                const keys = eg.gen();
                                const pk = keys[0];
                                const sk = keys[1];
                                let width = 1;
                                while (width <= maxWidth) {
                                    const wpk = eg.widePublicKey(pk, width);
                                    const wsk = eg.widePrivateKey(sk, width);
                                    const m = wpk.project(1).pGroup.randomElement(tc.randomSource, tc.statDist);
                                    for (let j = 0; j < 2; j++) {
                                        let c;
                                        let r;
                                        if (j === 0) {
                                            r = wsk.pRing.randomElement(tc.randomSource, tc.statDist);
                                            c = eg.encrypt(wpk, m, r);
                                        } else {
                                            r = wsk.pRing.getONE();
                                            c = eg.encrypt(wpk, m);
                                        }
                                        const a = eg.decrypt(wsk, c);
                                        if (!a.equals(m)) {
                                            let e = "ElGamal failed!" +
                                                "\npk = " + pk.toString() +
                                                "\nsk = " + sk.toString() +
                                                "\nkeyWidth = " + keyWidth +
                                                "\nwpk = " + wpk.toString() +
                                                "\nwsk = " + wsk.toString() +
                                                "\nwidth = " + width +
                                                "\nm = " + m.toString() +
                                                "\nc = " + c.toString() +
                                                "\na = " + a.toString();
                                            e += "\nr = " + r.toString();
                                            tc.error(e);
                                        }
                                    }
                                    width++;
                                }
                            }
                            keyWidth++;
                        }
                        i = (i + 1) % pGroups.length;
                    }
                    tc.end();
                }
                crypto.test_ElGamal = test_ElGamal;

                function test_ElGamalZKPoKWriteIn(tc) {
                    const prefix = "verificatum.crypto.ElGamalZKPoKWriteIn";
                    let e;
                    const endTime = tc.start([prefix + " (encrypt and decrypt)"], tc.testTime);
                    const pGroups = PGroupFactory.getSmallPGroups();
                    const maxKeyWidth = 3;
                    const maxWidth = 4;
                    const sha256 = new SHA256();
                    let i = 0;
                    while (!tc.done(endTime)) {
                        let keyWidth = 1;
                        while (keyWidth <= maxKeyWidth) {
                            const yGroup = PGroupFactory.getWideGroup(pGroups[i], keyWidth);
                            for (let l = 0; l < 2; l++) {
                                const ny = new ElGamalZKPoKWriteIn(l === 0, yGroup, sha256, tc.randomSource, tc.statDist);
                                const label = tc.randomSource.getBytes(10);
                                const keys = ny.gen();
                                const pk = keys[0];
                                const sk = keys[1];
                                let width = 1;
                                while (width <= maxWidth) {
                                    const wpk = ny.widePublicKey(pk, width);
                                    const wsk = ny.widePrivateKey(sk, width);
                                    const m = wpk.project(1).pGroup.randomElement(tc.randomSource, 10);
                                    const c = ny.encrypt(label, wpk, m);
                                    const a = ny.decrypt(label, wpk, wsk, c);
                                    e = "";
                                    if (typeof a === "string") {
                                        e = "NaorYung failed! (" + a + ")";
                                    } else {
                                        const aPGroupElement = a;
                                        if (!aPGroupElement.equals(m)) {
                                            e = "NaorYung failed!" +
                                                "\na = " + a.toString();
                                        }
                                    }
                                    if (e !== "") {
                                        e = e + "\npk = " + pk.toString() +
                                            "\nsk = " + sk.toString() +
                                            "\nkeyWidth = " + keyWidth +
                                            "\nwpk = " + wpk.toString() +
                                            "\nwsk = " + wsk.toString() +
                                            "\nwidth = " + width +
                                            "\nm = " + m.toString() +
                                            "\nc = " + c.toString();
                                        tc.error(e);
                                    }
                                    width++;
                                }
                            }
                            keyWidth++;
                        }
                        i = (i + 1) % pGroups.length;
                    }
                    tc.end();
                }
                crypto.test_ElGamalZKPoKWriteIn = test_ElGamalZKPoKWriteIn;

                function test_crypto(tc) {
                    const prefix = "verificatum/crypto/";
                    tc.startSet(prefix);
                    test_SHA256(tc);
                    test_ElGamal(tc);
                    test_SchnorrProof(tc);
                    test_SigmaProofPara(tc);
                    test_SigmaProofAnd(tc);
                    // test_SigmaProofOr(tc);
                    test_ElGamalZKPoKWriteIn(tc);
                }
                crypto.test_crypto = test_crypto;
            })(crypto = test.crypto || (test.crypto = {}));
            var PGroupFactory = verificatum.algebra.PGroupFactory;
            var WORDSIZE = verificatum.arithm.uli.WORDSIZE;
            var ofType = verificatum.base.ofType;
            var test_algebra = verificatum.dev.test.algebra.test_algebra;
            var test_arithm = verificatum.dev.test.arithm.test_arithm;
            var test_crypto = verificatum.dev.test.crypto.test_crypto;
            var version = verificatum.base.version;
            var wasm = verificatum.arithm.uli.wasm;
            /**
             * Testing and timing functions.
             */
            class TestContext {
                /**
                 * Creates a context with a given random source.
                 *
                 * @param testTime - Regulates the running time of testing.
                 * @param randomSource - Source of randomness.
                 * @param statDist - Statistical distance.
                 */
                constructor(testTime, randomSource, statDist) {
                    this.testTime = testTime;
                    this.randomSource = randomSource;
                    this.statDist = statDist;
                }
                /**
                 * Starts a test.
                 *
                 * @param module - Module name as string.
                 */
                startSet(module) {
                    this.writenl("");
                    this.writenl("Entering " + module);
                }
                /**
                 * Starts a test.
                 *
                 * @param headers - Names for tests.
                 * @param seconds - Running time of test.
                 * @returns End time of started test.
                 */
                start(headers, seconds) {
                    let s = "";
                    if (ofType(headers, "string")) {
                        s = "Test: " + headers + "...";
                    } else {
                        s = "Test: ";
                        for (let i = 0; i < headers.length; i++) {
                            if (i > 0) {
                                s += "\n      ";
                            }
                            s += headers[i];
                        }
                        s += "... ";
                    }
                    this.write(s);
                    return time() + seconds;
                }
                /**
                 * Returns true if the test should continued to run
                 * and false otherwise.
                 *
                 * @param endEpoch - End time of test.
                 * @returns True or false depending on if the test should be ended.
                 */
                done(endEpoch) {
                    return time() > endEpoch;
                }
                /**
                 * Prints the end of a test.
                 */
                end() {
                    this.writenl(" done.");
                }
                /**
                 * Prints error.
                 *
                 * @param msg - Error message.
                 */
                error(msg) {
                    this.write("\n\n" + msg + "\n\n");
                    this.write("");
                    this.exit(0);
                }
            }
            test.TestContext = TestContext;

            function test_verificatum(tc) {
                const groupTypes = PGroupFactory.getGroupTypes().join(", ");
                tc.writenl("");
                tc.writenl(` VTS ${version}`);
                tc.writenl("------------------------------------------------------------");
                tc.writenl(" RUNNING TESTS                                              ");
                tc.writenl(" Please be patient. Some tests take a long time to complete ");
                tc.writenl(" due to how comprehensive they are. Some are exhaustive.    ");
                tc.writenl("------------------------------------------------------------");
                tc.writenl(" Configuration:                                             ");
                tc.writenl(` WORDSIZE=${WORDSIZE}                                       `);
                tc.writenl(` WASM=${wasm}                                               `);
                tc.writenl(` GROUPTYPES=${groupTypes}                                   `);
                tc.writenl("------------------------------------------------------------");
                const prefix = "verificatum/";
                tc.startSet(prefix);
                test_arithm(tc);
                test_algebra(tc);
                test_crypto(tc);
            }
            test.test_verificatum = test_verificatum;
        })(test = dev.test || (dev.test = {}));
        var hex = verificatum.arithm.uli.hex;
        var hexbyte = verificatum.base.hexbyte;
        /**
         * Debugging functionality.
         * TSDOC_MODULE
         */
        /**
         * Returns the epoch in milliseconds.
         * @returns Epoch in milliseconds.
         */
        function time_ms() {
            return (new Date()).getTime();
        }
        dev.time_ms = time_ms;
        /**
         * Returns the epoch in seconds.
         * @returns Epoch in seconds.
         */
        function time() {
            return Math.floor(time_ms() / 1000);
        }
        dev.time = time;
        /**
         * Returns a hexadecimal representation of this input
         * array made for 28 = 28. It separates words by spaces.
         *
         * @param x - Array of words.
         * @returns Hexadecimal string representation of the array.
         */
        function hex28(x) {
            const h = hex(x);
            const offset = (7 - h.length % 7) % 7;
            let i = 0;
            let s = "";
            while (i < offset) {
                s += "0";
                i++;
            }
            let j = 0;
            while (j < h.length) {
                s += h[j];
                i++;
                if (j < h.length - 1 && i % 7 === 0) {
                    s += " ";
                }
                j++;
            }
            return s;
        }
        dev.hex28 = hex28;
        /**
         * Converts an integer to its hexadecimal encoding.
         *
         * @param x - A 32-bit JavaScript "number" that is actually an integer.
         * @returns Hexadecimal representation of this integer.
         */
        function uint32ToHex(x) {
            let hexString = "";
            for (let i = 0; i < 4; i++) {
                hexString = hexbyte(x & 0xFF) + hexString;
                x >>= 8;
            }
            return hexString;
        }
        dev.uint32ToHex = uint32ToHex;
        const hexToBinMap = new Map();
        hexToBinMap.set('0', '0000');
        hexToBinMap.set('1', '0001');
        hexToBinMap.set('2', '0010');
        hexToBinMap.set('3', '0011');
        hexToBinMap.set('4', '0100');
        hexToBinMap.set('5', '0101');
        hexToBinMap.set('6', '0110');
        hexToBinMap.set('7', '0111');
        hexToBinMap.set('8', '1000');
        hexToBinMap.set('9', '1001');
        hexToBinMap.set('A', '1010');
        hexToBinMap.set('B', '1011');
        hexToBinMap.set('C', '1100');
        hexToBinMap.set('D', '1101');
        hexToBinMap.set('E', '1110');
        hexToBinMap.set('F', '1111');
        /**
         * Converts a hexadecimal string into a binary string.
         *
         * @param hexString - Hexadecimal string.
         * @returns Binary string.
         */
        function hexToBin(hexString) {
            let res = "";
            for (let i = 0; i < hexString.length; i++) {
                res += hexToBinMap.get(hexString[i]);
            }
            return res;
        }
        dev.hexToBin = hexToBin;
    })(dev = verificatum.dev || (verificatum.dev = {}));
})(verificatum || (verificatum = {}));
(function(verificatum) {
    let dom;
    (function(dom) {
        var ByteTree = verificatum.algebra.ByteTree;
        var ElGamalZKPoKClient = verificatum.crypto.ElGamalZKPoKClient;
        var ElGamalZKPoKComp = verificatum.crypto.ElGamalZKPoKComp;
        var ElGamalZKPoKServer = verificatum.crypto.ElGamalZKPoKServer;
        var RandomSource = verificatum.base.RandomSource;
        var byteArrayToHex = verificatum.base.byteArrayToHex;
        class WebAPIRandomDevice extends RandomSource {
            constructor() {
                super();
            }
            getBytes(len) {
                const byteArray = new Uint8Array(len);
                window.crypto.getRandomValues(byteArray);
                const bytes = [];
                for (let i = 0; i < len; i++) {
                    bytes[i] = byteArray[i];
                }
                return bytes;
            }
        }
        dom.WebAPIRandomDevice = WebAPIRandomDevice;
        /**
         * Utility class for simplifying configuration and optimizing the use
         * of cryptosystems by users.
         */
        class WebAPIElGamalZKPoKComp extends ElGamalZKPoKComp {
            /**
             * Constructs a pre-computer for the given public key and variant
             * of the zero knowledge proof encoded.
             *
             * @param marshalled - Representation of a byte tree with two
             * children: (1) a full generalized El Gamal public key including
             * the group used using the format of the Verificatum Mix-Net
             * (VMN), and (2) an encoding of the zero knowledge proof used to
             * prove knowledge of the plaintext as well as possibly restrict
             * the plaintext to a subset, i.e., one of several options in an
             * election or free text of bounded length in the simplest case.
             * @param seed - A random seed consisting of exactly 32
             * bytes, or a cryptographically strong source of randomness.
             *
             * @throws Error if any input is not correctly formatted.
             */
            constructor(marshalled, seed, root, script) {
                super(marshalled, seed);
                /**
                 * The body of this function stores the code of the Worker.
                 */
                this.workerCode = function() {
                    let computer;
                    onmessage = function(e) {
                        const command = e.data[0];
                        if (command == "initialize") {
                            const root = e.data[1];
                            const script = e.data[2];
                            const marshalled = e.data[3];
                            const hexSeed = e.data[4];
                            importScripts(root + '/' + script);
                            computer = new ElGamalZKPoKComp(marshalled, hexSeed);
                        } else {
                            computer.precompute().then((bt) => {
                                const ab = (new Uint8Array(bt.toByteArray())).buffer;
                                // @ts-ignore
                                self.postMessage(ab, [ab]);
                            });
                        }
                    };
                };
                let code = this.workerCode.toString();
                code = code.replace("ElGamalZKPoKComp", "verificatum.crypto.ElGamalZKPoKComp");
                const blob = new Blob(["(" + code + ")();"]);
                const url = window.URL.createObjectURL(blob);
                this.worker = new Worker(url);
                const hexSeed = byteArrayToHex(seed);
                this.worker.postMessage(["initialize",
                    root,
                    script,
                    marshalled,
                    hexSeed
                ]);
            }
            precompute() {
                this.worker.postMessage([]);
                // Return the result as a promise.
                return new Promise((resolve, reject) => {
                    this.worker.onmessage = function(e) {
                        const a = Array.from(new Uint8Array(e.data));
                        const bt = ByteTree.readByteTreeFromByteArray(a);
                        resolve(bt);
                    };
                });
            }
        }
        dom.WebAPIElGamalZKPoKComp = WebAPIElGamalZKPoKComp;
        /**
         * Plain client that performs all computations in this thread using
         * the builtin cryptographically strong random source of the WebAPI.
         */
        class WebAPIElGamalZKPoKClient extends ElGamalZKPoKClient {
            /**
             * Constructs a client from the given representation of a public
             * key and zero knowledge proof and using the given random source.
             *
             * @param marshalled - Representation of public key and zero
             * knowledge proof as a byte tree encoded as a byte array or
             * string.
             * @param root - Location of script.
             * @param script - Script to be loaded in worker.
             */
            constructor(marshalled, root, script) {
                super(WebAPIElGamalZKPoKClient.comp(marshalled, root, script));
            }
            /**
             * Returns a computer of precomputed values for encryption that is
             * either run in this thread (default) or in a WebWorker thread.
             *
             * @param marshalled - Representation of public key and zero
             * knowledge proof as a byte tree encoded as a byte array or
             * string.
             * @param worker - Determines if a WebWorker is used or not.
             */
            static comp(marshalled, root, script) {
                const randomSource = new WebAPIRandomDevice();
                if (typeof script === "undefined") {
                    return new ElGamalZKPoKComp(marshalled, randomSource);
                } else if (typeof root != "undefined" && typeof script != "undefined") {
                    const seed = randomSource.getBytes(32);
                    return new WebAPIElGamalZKPoKComp(marshalled, seed, root, script);
                } else {
                    throw Error("Root provided without a script!");
                }
            }
        }
        dom.WebAPIElGamalZKPoKClient = WebAPIElGamalZKPoKClient;
        /**
         * Plain client that performs all computations in this thread using
         * the builtin cryptographically strong random source of the WebAPI.
         */
        class WebAPIElGamalZKPoKServer extends ElGamalZKPoKServer {
            /**
             * Constructs a server that uses the WebAPI random source
             * internally.
             *
             * @param groupName - Prime order group to use.
             * @param keyWidth - Width of product group used.
             */
            constructor(groupName, keyWidth = 1) {
                super(new WebAPIRandomDevice(), groupName, keyWidth);
            }
        }
        dom.WebAPIElGamalZKPoKServer = WebAPIElGamalZKPoKServer;
    })(dom = verificatum.dom || (verificatum.dom = {}));
})(verificatum || (verificatum = {}));
(function(verificatum) {
    let devdom;
    (function(devdom) {
        var SHA256PRG = verificatum.crypto.SHA256PRG;
        var Suite = verificatum.dev.bench.Suite;
        var TestContext = verificatum.dev.test.TestContext;
        var asciiToByteArray = verificatum.base.asciiToByteArray;
        var test_verificatum = verificatum.dev.test.test_verificatum;
        /**
         * Wrapper of code to be used in a WebWorker thread for benchmarking.
         * Depending on packaging it may be needed to patch the code.
         */
        devdom.benchworker = function() {
            const statDist = 50;
            const maxWidth = 4;
            const minSamples = 3;
            let suite;
            onmessage = function(e) {
                const command = e.data[0];
                if (command == "initialize") {
                    const root = e.data[1];
                    const script = e.data[2];
                    const seed = e.data[3];
                    importScripts(root + '/' + script);
                    suite = new Suite(statDist, maxWidth, seed, "html");
                    postMessage([command]);
                } else {
                    postMessage(suite.bench(command, minSamples));
                }
            };
        };
        /**
         * Wrapper of code to be used in a WebWorker thread for testing.
         * Depending on packaging it may be needed to patch the code.
         */
        devdom.testworker = function() {
            const statDist = 50;
            onmessage = function(e) {
                const command = e.data[0];
                if (command == "initialize") {
                    const root = e.data[1];
                    const script = e.data[2];
                    const seed = e.data[3];
                    const testTime = parseInt(e.data[4]);
                    importScripts(root + '/' + script);
                    const wtc = new WorkerTestContext(testTime, seed, statDist, postMessage);
                    test_verificatum(wtc);
                }
            };
        };
        /**
         * Testing and timing functions.
         */
        function rs(seed) {
            const randomSource = new SHA256PRG();
            const seedBytes = asciiToByteArray(seed);
            randomSource.setSeed(seedBytes);
            return randomSource;
        }
        class WorkerTestContext extends TestContext {
            /**
             * Creates a context with a given random source.
             *
             * @param testTime - Regulates the running time of testing.
             * @param randomSource - Source of randomness.
             * @param statDist - Statistical distance.
             */
            constructor(testTime, seed, statDist, postMessage) {
                super(testTime, rs(seed), statDist);
                this.postMessage = postMessage;
            }
            write(s) {
                postMessage([s]);
            }
            writenl(s) {
                postMessage([s + '<br>']);
            }
            /**
             * Exit aggressively.
             */
            exit(exitCode) {
                self.close();
            }
        }
        devdom.WorkerTestContext = WorkerTestContext;
    })(devdom = verificatum.devdom || (verificatum.devdom = {}));
})(verificatum || (verificatum = {}));