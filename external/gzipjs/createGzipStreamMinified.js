require = (function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f
            }
            var l = n[o] = {
                exports: {}
            };
            t[o][0].call(l.exports, function (e) {
                var n = t[o][1][e];
                return s(n ? n : e)
            }, l, l.exports, e, t, n, r)
        }
        return n[o].exports
    }
    var i = typeof require == "function" && require;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s
})({
    1: [function (require, module, exports) {
        (function () {
            'use strict';

            var crc32 = require('crc32'),
                deflate = require('deflate-js'),
                // magic numbers marking this file as GZIP
                ID1 = 0x1F,
                ID2 = 0x8B,
                compressionMethods = {
                    'deflate': 8
                },
                possibleFlags = {
                    'FTEXT': 0x01,
                    'FHCRC': 0x02,
                    'FEXTRA': 0x04,
                    'FNAME': 0x08,
                    'FCOMMENT': 0x10
                },
                osMap = {
                    'fat': 0, // FAT file system (DOS, OS/2, NT) + PKZIPW 2.50 VFAT, NTFS
                    'amiga': 1, // Amiga
                    'vmz': 2, // VMS (VAX or Alpha AXP)
                    'unix': 3, // Unix
                    'vm/cms': 4, // VM/CMS
                    'atari': 5, // Atari
                    'hpfs': 6, // HPFS file system (OS/2, NT 3.x)
                    'macintosh': 7, // Macintosh
                    'z-system': 8, // Z-System
                    'cplm': 9, // CP/M
                    'tops-20': 10, // TOPS-20
                    'ntfs': 11, // NTFS file system (NT)
                    'qdos': 12, // SMS/QDOS
                    'acorn': 13, // Acorn RISC OS
                    'vfat': 14, // VFAT file system (Win95, NT)
                    'vms': 15, // MVS (code also taken for PRIMOS)
                    'beos': 16, // BeOS (BeBox or PowerMac)
                    'tandem': 17, // Tandem/NSK
                    'theos': 18 // THEOS
                },
                os = 'unix',
                DEFAULT_LEVEL = 6;

            function putByte(n, arr) {
                arr.push(n & 0xFF);
            }

            // LSB first
            function putShort(n, arr) {
                arr.push(n & 0xFF);
                arr.push(n >>> 8);
            }

            // LSB first
            function putLong(n, arr) {
                putShort(n & 0xffff, arr);
                putShort(n >>> 16, arr);
            }

            function putString(s, arr) {
                var i, len = s.length;
                for (i = 0; i < len; i += 1) {
                    putByte(s.charCodeAt(i), arr);
                }
            }

            function readByte(arr) {
                return arr.shift();
            }

            function readShort(arr) {
                return arr.shift() | (arr.shift() << 8);
            }

            function readLong(arr) {
                var n1 = readShort(arr),
                    n2 = readShort(arr);

                // JavaScript can't handle bits in the position 32
                // we'll emulate this by removing the left-most bit (if it exists)
                // and add it back in via multiplication, which does work
                if (n2 > 32768) {
                    n2 -= 32768;

                    return ((n2 << 16) | n1) + 32768 * Math.pow(2, 16);
                }

                return (n2 << 16) | n1;
            }

            function readString(arr) {
                var charArr = [];

                // turn all bytes into chars until the terminating null
                while (arr[0] !== 0) {
                    charArr.push(String.fromCharCode(arr.shift()));
                }

                // throw away terminating null
                arr.shift();

                // join all characters into a cohesive string
                return charArr.join('');
            }

            /*
             * Reads n number of bytes and return as an array.
             *
             * @param arr- Array of bytes to read from
             * @param n- Number of bytes to read
             */
            function readBytes(arr, n) {
                var i, ret = [];
                for (i = 0; i < n; i += 1) {
                    ret.push(arr.shift());
                }

                return ret;
            }

            /*
             * ZIPs a file in GZIP format. The format is as given by the spec, found at:
             * http://www.gzip.org/zlib/rfc-gzip.html
             *
             * Omitted parts in this implementation:
             */
            function zip(data, options) {
                var flags = 0,
                    level,
                    crc, out = [];

                if (!options) {
                    options = {};
                }
                level = options.level || DEFAULT_LEVEL;

                if (typeof data === 'string') {
                    data = Array.prototype.map.call(data, function (char) {
                        return char.charCodeAt(0);
                    });
                }

                // magic number marking this file as GZIP
                putByte(ID1, out);
                putByte(ID2, out);

                putByte(compressionMethods['deflate'], out);

                if (options.name) {
                    flags |= possibleFlags['FNAME'];
                }

                putByte(flags, out);
                putLong(options.timestamp || parseInt(Date.now() / 1000, 10), out);

                // put deflate args (extra flags)
                if (level === 1) {
                    // fastest algorithm
                    putByte(4, out);
                } else if (level === 9) {
                    // maximum compression (fastest algorithm)
                    putByte(2, out);
                } else {
                    putByte(0, out);
                }

                // OS identifier
                putByte(osMap[os], out);

                if (options.name) {
                    // ignore the directory part
                    putString(options.name.substring(options.name.lastIndexOf('/') + 1), out);

                    // terminating null
                    putByte(0, out);
                }

                deflate.deflate(data, level).forEach(function (byte) {
                    putByte(byte, out);
                });

                putLong(parseInt(crc32(data), 16), out);
                putLong(data.length, out);

                return out;
            }

            function unzip(data, options) {
                // start with a copy of the array
                var arr = Array.prototype.slice.call(data, 0),
                    t,
                    compressionMethod,
                    flags,
                    mtime,
                    xFlags,
                    key,
                    os,
                    crc,
                    size,
                    res;

                // check the first two bytes for the magic numbers
                if (readByte(arr) !== ID1 || readByte(arr) !== ID2) {
                    throw 'Not a GZIP file';
                }

                t = readByte(arr);
                t = Object.keys(compressionMethods).some(function (key) {
                    compressionMethod = key;
                    return compressionMethods[key] === t;
                });

                if (!t) {
                    throw 'Unsupported compression method';
                }

                flags = readByte(arr);
                mtime = readLong(arr);
                xFlags = readByte(arr);
                t = readByte(arr);
                Object.keys(osMap).some(function (key) {
                    if (osMap[key] === t) {
                        os = key;
                        return true;
                    }
                });

                // just throw away the bytes for now
                if (flags & possibleFlags['FEXTRA']) {
                    t = readShort(arr);
                    readBytes(arr, t);
                }

                // just throw away for now
                if (flags & possibleFlags['FNAME']) {
                    readString(arr);
                }

                // just throw away for now
                if (flags & possibleFlags['FCOMMENT']) {
                    readString(arr);
                }

                // just throw away for now
                if (flags & possibleFlags['FHCRC']) {
                    readShort(arr);
                }

                if (compressionMethod === 'deflate') {
                    // give deflate everything but the last 8 bytes
                    // the last 8 bytes are for the CRC32 checksum and filesize
                    res = deflate.inflate(arr.splice(0, arr.length - 8));
                }

                if (flags & possibleFlags['FTEXT']) {
                    res = Array.prototype.map.call(res, function (byte) {
                        return String.fromCharCode(byte);
                    }).join('');
                }

                crc = readLong(arr);
                if (crc !== parseInt(crc32(res), 16)) {
                    throw 'Checksum does not match';
                }

                size = readLong(arr);
                if (size !== res.length) {
                    throw 'Size of decompressed file not correct';
                }

                return res;
            }

            module.exports = {
                zip: zip,
                unzip: unzip,
                get DEFAULT_LEVEL() {
                    return DEFAULT_LEVEL;
                }
            };
        }());

}, {
        "crc32": 2,
        "deflate-js": 3
    }],
    2: [function (require, module, exports) {
        (function () {
            'use strict';

            var table = [],
                poly = 0xEDB88320; // reverse polynomial

            // build the table
            function makeTable() {
                var c, n, k;

                for (n = 0; n < 256; n += 1) {
                    c = n;
                    for (k = 0; k < 8; k += 1) {
                        if (c & 1) {
                            c = poly ^ (c >>> 1);
                        } else {
                            c = c >>> 1;
                        }
                    }
                    table[n] = c >>> 0;
                }
            }

            function strToArr(str) {
                // sweet hack to turn string into a 'byte' array
                return Array.prototype.map.call(str, function (c) {
                    return c.charCodeAt(0);
                });
            }

            /*
             * Compute CRC of array directly.
             *
             * This is slower for repeated calls, so append mode is not supported.
             */
            function crcDirect(arr) {
                var crc = -1, // initial contents of LFBSR
                    i, j, l, temp;

                for (i = 0, l = arr.length; i < l; i += 1) {
                    temp = (crc ^ arr[i]) & 0xff;

                    // read 8 bits one at a time
                    for (j = 0; j < 8; j += 1) {
                        if ((temp & 1) === 1) {
                            temp = (temp >>> 1) ^ poly;
                        } else {
                            temp = (temp >>> 1);
                        }
                    }
                    crc = (crc >>> 8) ^ temp;
                }

                // flip bits
                return crc ^ -1;
            }

            /*
             * Compute CRC with the help of a pre-calculated table.
             *
             * This supports append mode, if the second parameter is set.
             */
            function crcTable(arr, append) {
                var crc, i, l;

                // if we're in append mode, don't reset crc
                // if arr is null or undefined, reset table and return
                if (typeof crcTable.crc === 'undefined' || !append || !arr) {
                    crcTable.crc = 0 ^ -1;

                    if (!arr) {
                        return;
                    }
                }

                // store in temp variable for minor speed gain
                crc = crcTable.crc;

                for (i = 0, l = arr.length; i < l; i += 1) {
                    crc = (crc >>> 8) ^ table[(crc ^ arr[i]) & 0xff];
                }

                crcTable.crc = crc;

                return crc ^ -1;
            }

            // build the table
            // this isn't that costly, and most uses will be for table assisted mode
            makeTable();

            module.exports = function (val, direct) {
                var val = (typeof val === 'string') ? strToArr(val) : val,
                    ret = direct ? crcDirect(val) : crcTable(val);

                // convert to 2's complement hex
                return (ret >>> 0).toString(16);
            };
            module.exports.direct = crcDirect;
            module.exports.table = crcTable;
        }());

}, {}],
    3: [function (require, module, exports) {
        (function () {
            'use strict';

            module.exports = {
                'inflate': require('./lib/rawinflate.js'),
                'deflate': require('./lib/rawdeflate.js')
            };
        }());

}, {
        "./lib/rawdeflate.js": 4,
        "./lib/rawinflate.js": 5
    }],
    4: [function (require, module, exports) {
        /*
         * $Id: createGzipStreamMinified.js,v 1.1 2015/05/20 09:30:43 spotham Exp $
         *
         * Original:
         *   http://www.onicos.com/staff/iz/amuse/javascript/expert/deflate.txt
         */

        /* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
         * Version: 1.0.1
         * LastModified: Dec 25 1999
         */

        /* Interface:
         * data = deflate(src);
         */

        (function () {
            /* constant parameters */
            var WSIZE = 32768, // Sliding Window size
                STORED_BLOCK = 0,
                STATIC_TREES = 1,
                DYN_TREES = 2,

                /* for deflate */
                DEFAULT_LEVEL = 6,
                FULL_SEARCH = false,
                INBUFSIZ = 32768, // Input buffer size
                //INBUF_EXTRA = 64, // Extra buffer
                OUTBUFSIZ = 1024 * 8,
                window_size = 2 * WSIZE,
                MIN_MATCH = 3,
                MAX_MATCH = 258,
                BITS = 16,
                // for SMALL_MEM
                LIT_BUFSIZE = 0x2000,
                //		HASH_BITS = 13,
                //for MEDIUM_MEM
                //	LIT_BUFSIZE = 0x4000,
                //	HASH_BITS = 14,
                // for BIG_MEM
                //	LIT_BUFSIZE = 0x8000,
                HASH_BITS = 15,
                DIST_BUFSIZE = LIT_BUFSIZE,
                HASH_SIZE = 1 << HASH_BITS,
                HASH_MASK = HASH_SIZE - 1,
                WMASK = WSIZE - 1,
                NIL = 0, // Tail of hash chains
                TOO_FAR = 4096,
                MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1,
                MAX_DIST = WSIZE - MIN_LOOKAHEAD,
                SMALLEST = 1,
                MAX_BITS = 15,
                MAX_BL_BITS = 7,
                LENGTH_CODES = 29,
                LITERALS = 256,
                END_BLOCK = 256,
                L_CODES = LITERALS + 1 + LENGTH_CODES,
                D_CODES = 30,
                BL_CODES = 19,
                REP_3_6 = 16,
                REPZ_3_10 = 17,
                REPZ_11_138 = 18,
                HEAP_SIZE = 2 * L_CODES + 1,
                H_SHIFT = parseInt((HASH_BITS + MIN_MATCH - 1) / MIN_MATCH, 10),

                /* variables */
                free_queue,
                qhead,
                qtail,
                initflag,
                outbuf = null,
                outcnt,
                outoff,
                complete,
                window,
                d_buf,
                l_buf,
                prev,
                bi_buf,
                bi_valid,
                block_start,
                ins_h,
                hash_head,
                prev_match,
                match_available,
                match_length,
                prev_length,
                strstart,
                match_start,
                eofile,
                lookahead,
                max_chain_length,
                max_lazy_match,
                compr_level,
                good_match,
                nice_match,
                dyn_ltree,
                dyn_dtree,
                static_ltree,
                static_dtree,
                bl_tree,
                l_desc,
                d_desc,
                bl_desc,
                bl_count,
                heap,
                heap_len,
                heap_max,
                depth,
                length_code,
                dist_code,
                base_length,
                base_dist,
                flag_buf,
                last_lit,
                last_dist,
                last_flags,
                flags,
                flag_bit,
                opt_len,
                static_len,
                deflate_data,
                deflate_pos;

            if (LIT_BUFSIZE > INBUFSIZ) {
                console.error("error: INBUFSIZ is too small");
            }
            if ((WSIZE << 1) > (1 << BITS)) {
                console.error("error: WSIZE is too large");
            }
            if (HASH_BITS > BITS - 1) {
                console.error("error: HASH_BITS is too large");
            }
            if (HASH_BITS < 8 || MAX_MATCH !== 258) {
                console.error("error: Code too clever");
            }

            /* objects (deflate) */

            function DeflateCT() {
                this.fc = 0; // frequency count or bit string
                this.dl = 0; // father node in Huffman tree or length of bit string
            }

            function DeflateTreeDesc() {
                this.dyn_tree = null; // the dynamic tree
                this.static_tree = null; // corresponding static tree or NULL
                this.extra_bits = null; // extra bits for each code or NULL
                this.extra_base = 0; // base index for extra_bits
                this.elems = 0; // max number of elements in the tree
                this.max_length = 0; // max bit length for the codes
                this.max_code = 0; // largest code with non zero frequency
            }

            /* Values for max_lazy_match, good_match and max_chain_length, depending on
             * the desired pack level (0..9). The values given below have been tuned to
             * exclude worst case performance for pathological files. Better values may be
             * found for specific files.
             */
            function DeflateConfiguration(a, b, c, d) {
                this.good_length = a; // reduce lazy search above this match length
                this.max_lazy = b; // do not perform lazy search above this match length
                this.nice_length = c; // quit search above this match length
                this.max_chain = d;
            }

            function DeflateBuffer() {
                this.next = null;
                this.len = 0;
                this.ptr = []; // new Array(OUTBUFSIZ); // ptr.length is never read
                this.off = 0;
            }

            /* constant tables */
            var extra_lbits = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
            var extra_dbits = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
            var extra_blbits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7];
            var bl_order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
            var configuration_table = [
		new DeflateConfiguration(0, 0, 0, 0),
		new DeflateConfiguration(4, 4, 8, 4),
		new DeflateConfiguration(4, 5, 16, 8),
		new DeflateConfiguration(4, 6, 32, 32),
		new DeflateConfiguration(4, 4, 16, 16),
		new DeflateConfiguration(8, 16, 32, 32),
		new DeflateConfiguration(8, 16, 128, 128),
		new DeflateConfiguration(8, 32, 128, 256),
		new DeflateConfiguration(32, 128, 258, 1024),
		new DeflateConfiguration(32, 258, 258, 4096)
	];


            /* routines (deflate) */

            function deflate_start(level) {
                var i;

                if (!level) {
                    level = DEFAULT_LEVEL;
                } else if (level < 1) {
                    level = 1;
                } else if (level > 9) {
                    level = 9;
                }

                compr_level = level;
                initflag = false;
                eofile = false;
                if (outbuf !== null) {
                    return;
                }

                free_queue = qhead = qtail = null;
                outbuf = []; // new Array(OUTBUFSIZ); // outbuf.length never called
                window = []; // new Array(window_size); // window.length never called
                d_buf = []; // new Array(DIST_BUFSIZE); // d_buf.length never called
                l_buf = []; // new Array(INBUFSIZ + INBUF_EXTRA); // l_buf.length never called
                prev = []; // new Array(1 << BITS); // prev.length never called

                dyn_ltree = [];
                for (i = 0; i < HEAP_SIZE; i++) {
                    dyn_ltree[i] = new DeflateCT();
                }
                dyn_dtree = [];
                for (i = 0; i < 2 * D_CODES + 1; i++) {
                    dyn_dtree[i] = new DeflateCT();
                }
                static_ltree = [];
                for (i = 0; i < L_CODES + 2; i++) {
                    static_ltree[i] = new DeflateCT();
                }
                static_dtree = [];
                for (i = 0; i < D_CODES; i++) {
                    static_dtree[i] = new DeflateCT();
                }
                bl_tree = [];
                for (i = 0; i < 2 * BL_CODES + 1; i++) {
                    bl_tree[i] = new DeflateCT();
                }
                l_desc = new DeflateTreeDesc();
                d_desc = new DeflateTreeDesc();
                bl_desc = new DeflateTreeDesc();
                bl_count = []; // new Array(MAX_BITS+1); // bl_count.length never called
                heap = []; // new Array(2*L_CODES+1); // heap.length never called
                depth = []; // new Array(2*L_CODES+1); // depth.length never called
                length_code = []; // new Array(MAX_MATCH-MIN_MATCH+1); // length_code.length never called
                dist_code = []; // new Array(512); // dist_code.length never called
                base_length = []; // new Array(LENGTH_CODES); // base_length.length never called
                base_dist = []; // new Array(D_CODES); // base_dist.length never called
                flag_buf = []; // new Array(parseInt(LIT_BUFSIZE / 8, 10)); // flag_buf.length never called
            }

            function deflate_end() {
                free_queue = qhead = qtail = null;
                outbuf = null;
                window = null;
                d_buf = null;
                l_buf = null;
                prev = null;
                dyn_ltree = null;
                dyn_dtree = null;
                static_ltree = null;
                static_dtree = null;
                bl_tree = null;
                l_desc = null;
                d_desc = null;
                bl_desc = null;
                bl_count = null;
                heap = null;
                depth = null;
                length_code = null;
                dist_code = null;
                base_length = null;
                base_dist = null;
                flag_buf = null;
            }

            function reuse_queue(p) {
                p.next = free_queue;
                free_queue = p;
            }

            function new_queue() {
                var p;

                if (free_queue !== null) {
                    p = free_queue;
                    free_queue = free_queue.next;
                } else {
                    p = new DeflateBuffer();
                }
                p.next = null;
                p.len = p.off = 0;

                return p;
            }

            function head1(i) {
                return prev[WSIZE + i];
            }

            function head2(i, val) {
                return (prev[WSIZE + i] = val);
            }

            /* put_byte is used for the compressed output, put_ubyte for the
             * uncompressed output. However unlzw() uses window for its
             * suffix table instead of its output buffer, so it does not use put_ubyte
             * (to be cleaned up).
             */
            function put_byte(c) {
                outbuf[outoff + outcnt++] = c;
                if (outoff + outcnt === OUTBUFSIZ) {
                    qoutbuf();
                }
            }

            /* Output a 16 bit value, lsb first */
            function put_short(w) {
                w &= 0xffff;
                if (outoff + outcnt < OUTBUFSIZ - 2) {
                    outbuf[outoff + outcnt++] = (w & 0xff);
                    outbuf[outoff + outcnt++] = (w >>> 8);
                } else {
                    put_byte(w & 0xff);
                    put_byte(w >>> 8);
                }
            }

            /* ==========================================================================
             * Insert string s in the dictionary and set match_head to the previous head
             * of the hash chain (the most recent string with same hash key). Return
             * the previous length of the hash chain.
             * IN  assertion: all calls to to INSERT_STRING are made with consecutive
             *    input characters and the first MIN_MATCH bytes of s are valid
             *    (except for the last MIN_MATCH-1 bytes of the input file).
             */
            function INSERT_STRING() {
                ins_h = ((ins_h << H_SHIFT) ^ (window[strstart + MIN_MATCH - 1] & 0xff)) & HASH_MASK;
                hash_head = head1(ins_h);
                prev[strstart & WMASK] = hash_head;
                head2(ins_h, strstart);
            }

            /* Send a code of the given tree. c and tree must not have side effects */
            function SEND_CODE(c, tree) {
                send_bits(tree[c].fc, tree[c].dl);
            }

            /* Mapping from a distance to a distance code. dist is the distance - 1 and
             * must not have side effects. dist_code[256] and dist_code[257] are never
             * used.
             */
            function D_CODE(dist) {
                return (dist < 256 ? dist_code[dist] : dist_code[256 + (dist >> 7)]) & 0xff;
            }

            /* ==========================================================================
             * Compares to subtrees, using the tree depth as tie breaker when
             * the subtrees have equal frequency. This minimizes the worst case length.
             */
            function SMALLER(tree, n, m) {
                return tree[n].fc < tree[m].fc || (tree[n].fc === tree[m].fc && depth[n] <= depth[m]);
            }

            /* ==========================================================================
             * read string data
             */
            function read_buff(buff, offset, n) {
                var i;
                for (i = 0; i < n && deflate_pos < deflate_data.length; i++) {
                    buff[offset + i] = deflate_data[deflate_pos++] & 0xff;
                }
                return i;
            }

            /* ==========================================================================
             * Initialize the "longest match" routines for a new file
             */
            function lm_init() {
                var j;

                // Initialize the hash table. */
                for (j = 0; j < HASH_SIZE; j++) {
                    // head2(j, NIL);
                    prev[WSIZE + j] = 0;
                }
                // prev will be initialized on the fly */

                // Set the default configuration parameters:
                max_lazy_match = configuration_table[compr_level].max_lazy;
                good_match = configuration_table[compr_level].good_length;
                if (!FULL_SEARCH) {
                    nice_match = configuration_table[compr_level].nice_length;
                }
                max_chain_length = configuration_table[compr_level].max_chain;

                strstart = 0;
                block_start = 0;

                lookahead = read_buff(window, 0, 2 * WSIZE);
                if (lookahead <= 0) {
                    eofile = true;
                    lookahead = 0;
                    return;
                }
                eofile = false;
                // Make sure that we always have enough lookahead. This is important
                // if input comes from a device such as a tty.
                while (lookahead < MIN_LOOKAHEAD && !eofile) {
                    fill_window();
                }

                // If lookahead < MIN_MATCH, ins_h is garbage, but this is
                // not important since only literal bytes will be emitted.
                ins_h = 0;
                for (j = 0; j < MIN_MATCH - 1; j++) {
                    // UPDATE_HASH(ins_h, window[j]);
                    ins_h = ((ins_h << H_SHIFT) ^ (window[j] & 0xff)) & HASH_MASK;
                }
            }

            /* ==========================================================================
             * Set match_start to the longest match starting at the given string and
             * return its length. Matches shorter or equal to prev_length are discarded,
             * in which case the result is equal to prev_length and match_start is
             * garbage.
             * IN assertions: cur_match is the head of the hash chain for the current
             *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
             */
            function longest_match(cur_match) {
                var chain_length = max_chain_length; // max hash chain length
                var scanp = strstart; // current string
                var matchp; // matched string
                var len; // length of current match
                var best_len = prev_length; // best match length so far

                // Stop when cur_match becomes <= limit. To simplify the code,
                // we prevent matches with the string of window index 0.
                var limit = (strstart > MAX_DIST ? strstart - MAX_DIST : NIL);

                var strendp = strstart + MAX_MATCH;
                var scan_end1 = window[scanp + best_len - 1];
                var scan_end = window[scanp + best_len];

                var i, broke;

                // Do not waste too much time if we already have a good match: */
                if (prev_length >= good_match) {
                    chain_length >>= 2;
                }

                // Assert(encoder->strstart <= window_size-MIN_LOOKAHEAD, "insufficient lookahead");

                do {
                    // Assert(cur_match < encoder->strstart, "no future");
                    matchp = cur_match;

                    // Skip to next match if the match length cannot increase
                    // or if the match length is less than 2:
                    if (window[matchp + best_len] !== scan_end ||
                        window[matchp + best_len - 1] !== scan_end1 ||
                        window[matchp] !== window[scanp] ||
                        window[++matchp] !== window[scanp + 1]) {
                        continue;
                    }

                    // The check at best_len-1 can be removed because it will be made
                    // again later. (This heuristic is not always a win.)
                    // It is not necessary to compare scan[2] and match[2] since they
                    // are always equal when the other bytes match, given that
                    // the hash keys are equal and that HASH_BITS >= 8.
                    scanp += 2;
                    matchp++;

                    // We check for insufficient lookahead only every 8th comparison;
                    // the 256th check will be made at strstart+258.
                    while (scanp < strendp) {
                        broke = false;
                        for (i = 0; i < 8; i += 1) {
                            scanp += 1;
                            matchp += 1;
                            if (window[scanp] !== window[matchp]) {
                                broke = true;
                                break;
                            }
                        }

                        if (broke) {
                            break;
                        }
                    }

                    len = MAX_MATCH - (strendp - scanp);
                    scanp = strendp - MAX_MATCH;

                    if (len > best_len) {
                        match_start = cur_match;
                        best_len = len;
                        if (FULL_SEARCH) {
                            if (len >= MAX_MATCH) {
                                break;
                            }
                        } else {
                            if (len >= nice_match) {
                                break;
                            }
                        }

                        scan_end1 = window[scanp + best_len - 1];
                        scan_end = window[scanp + best_len];
                    }
                } while ((cur_match = prev[cur_match & WMASK]) > limit && --chain_length !== 0);

                return best_len;
            }

            /* ==========================================================================
             * Fill the window when the lookahead becomes insufficient.
             * Updates strstart and lookahead, and sets eofile if end of input file.
             * IN assertion: lookahead < MIN_LOOKAHEAD && strstart + lookahead > 0
             * OUT assertions: at least one byte has been read, or eofile is set;
             *    file reads are performed for at least two bytes (required for the
             *    translate_eol option).
             */
            function fill_window() {
                var n, m;

                // Amount of free space at the end of the window.
                var more = window_size - lookahead - strstart;

                // If the window is almost full and there is insufficient lookahead,
                // move the upper half to the lower one to make room in the upper half.
                if (more === -1) {
                    // Very unlikely, but possible on 16 bit machine if strstart == 0
                    // and lookahead == 1 (input done one byte at time)
                    more--;
                } else if (strstart >= WSIZE + MAX_DIST) {
                    // By the IN assertion, the window is not empty so we can't confuse
                    // more == 0 with more == 64K on a 16 bit machine.
                    // Assert(window_size == (ulg)2*WSIZE, "no sliding with BIG_MEM");

                    // System.arraycopy(window, WSIZE, window, 0, WSIZE);
                    for (n = 0; n < WSIZE; n++) {
                        window[n] = window[n + WSIZE];
                    }

                    match_start -= WSIZE;
                    strstart -= WSIZE; /* we now have strstart >= MAX_DIST: */
                    block_start -= WSIZE;

                    for (n = 0; n < HASH_SIZE; n++) {
                        m = head1(n);
                        head2(n, m >= WSIZE ? m - WSIZE : NIL);
                    }
                    for (n = 0; n < WSIZE; n++) {
                        // If n is not on any hash chain, prev[n] is garbage but
                        // its value will never be used.
                        m = prev[n];
                        prev[n] = (m >= WSIZE ? m - WSIZE : NIL);
                    }
                    more += WSIZE;
                }
                // At this point, more >= 2
                if (!eofile) {
                    n = read_buff(window, strstart + lookahead, more);
                    if (n <= 0) {
                        eofile = true;
                    } else {
                        lookahead += n;
                    }
                }
            }

            /* ==========================================================================
             * Processes a new input file and return its compressed length. This
             * function does not perform lazy evaluationof matches and inserts
             * new strings in the dictionary only for unmatched strings or for short
             * matches. It is used only for the fast compression options.
             */
            function deflate_fast() {
                while (lookahead !== 0 && qhead === null) {
                    var flush; // set if current block must be flushed

                    // Insert the string window[strstart .. strstart+2] in the
                    // dictionary, and set hash_head to the head of the hash chain:
                    INSERT_STRING();

                    // Find the longest match, discarding those <= prev_length.
                    // At this point we have always match_length < MIN_MATCH
                    if (hash_head !== NIL && strstart - hash_head <= MAX_DIST) {
                        // To simplify the code, we prevent matches with the string
                        // of window index 0 (in particular we have to avoid a match
                        // of the string with itself at the start of the input file).
                        match_length = longest_match(hash_head);
                        // longest_match() sets match_start */
                        if (match_length > lookahead) {
                            match_length = lookahead;
                        }
                    }
                    if (match_length >= MIN_MATCH) {
                        // check_match(strstart, match_start, match_length);

                        flush = ct_tally(strstart - match_start, match_length - MIN_MATCH);
                        lookahead -= match_length;

                        // Insert new strings in the hash table only if the match length
                        // is not too large. This saves time but degrades compression.
                        if (match_length <= max_lazy_match) {
                            match_length--; // string at strstart already in hash table
                            do {
                                strstart++;
                                INSERT_STRING();
                                // strstart never exceeds WSIZE-MAX_MATCH, so there are
                                // always MIN_MATCH bytes ahead. If lookahead < MIN_MATCH
                                // these bytes are garbage, but it does not matter since
                                // the next lookahead bytes will be emitted as literals.
                            } while (--match_length !== 0);
                            strstart++;
                        } else {
                            strstart += match_length;
                            match_length = 0;
                            ins_h = window[strstart] & 0xff;
                            // UPDATE_HASH(ins_h, window[strstart + 1]);
                            ins_h = ((ins_h << H_SHIFT) ^ (window[strstart + 1] & 0xff)) & HASH_MASK;

                            //#if MIN_MATCH !== 3
                            //		Call UPDATE_HASH() MIN_MATCH-3 more times
                            //#endif

                        }
                    } else {
                        // No match, output a literal byte */
                        flush = ct_tally(0, window[strstart] & 0xff);
                        lookahead--;
                        strstart++;
                    }
                    if (flush) {
                        flush_block(0);
                        block_start = strstart;
                    }

                    // Make sure that we always have enough lookahead, except
                    // at the end of the input file. We need MAX_MATCH bytes
                    // for the next match, plus MIN_MATCH bytes to insert the
                    // string following the next match.
                    while (lookahead < MIN_LOOKAHEAD && !eofile) {
                        fill_window();
                    }
                }
            }

            function deflate_better() {
                // Process the input block. */
                while (lookahead !== 0 && qhead === null) {
                    // Insert the string window[strstart .. strstart+2] in the
                    // dictionary, and set hash_head to the head of the hash chain:
                    INSERT_STRING();

                    // Find the longest match, discarding those <= prev_length.
                    prev_length = match_length;
                    prev_match = match_start;
                    match_length = MIN_MATCH - 1;

                    if (hash_head !== NIL && prev_length < max_lazy_match && strstart - hash_head <= MAX_DIST) {
                        // To simplify the code, we prevent matches with the string
                        // of window index 0 (in particular we have to avoid a match
                        // of the string with itself at the start of the input file).
                        match_length = longest_match(hash_head);
                        // longest_match() sets match_start */
                        if (match_length > lookahead) {
                            match_length = lookahead;
                        }

                        // Ignore a length 3 match if it is too distant: */
                        if (match_length === MIN_MATCH && strstart - match_start > TOO_FAR) {
                            // If prev_match is also MIN_MATCH, match_start is garbage
                            // but we will ignore the current match anyway.
                            match_length--;
                        }
                    }
                    // If there was a match at the previous step and the current
                    // match is not better, output the previous match:
                    if (prev_length >= MIN_MATCH && match_length <= prev_length) {
                        var flush; // set if current block must be flushed

                        // check_match(strstart - 1, prev_match, prev_length);
                        flush = ct_tally(strstart - 1 - prev_match, prev_length - MIN_MATCH);

                        // Insert in hash table all strings up to the end of the match.
                        // strstart-1 and strstart are already inserted.
                        lookahead -= prev_length - 1;
                        prev_length -= 2;
                        do {
                            strstart++;
                            INSERT_STRING();
                            // strstart never exceeds WSIZE-MAX_MATCH, so there are
                            // always MIN_MATCH bytes ahead. If lookahead < MIN_MATCH
                            // these bytes are garbage, but it does not matter since the
                            // next lookahead bytes will always be emitted as literals.
                        } while (--prev_length !== 0);
                        match_available = false;
                        match_length = MIN_MATCH - 1;
                        strstart++;
                        if (flush) {
                            flush_block(0);
                            block_start = strstart;
                        }
                    } else if (match_available) {
                        // If there was no match at the previous position, output a
                        // single literal. If there was a match but the current match
                        // is longer, truncate the previous match to a single literal.
                        if (ct_tally(0, window[strstart - 1] & 0xff)) {
                            flush_block(0);
                            block_start = strstart;
                        }
                        strstart++;
                        lookahead--;
                    } else {
                        // There is no previous match to compare with, wait for
                        // the next step to decide.
                        match_available = true;
                        strstart++;
                        lookahead--;
                    }

                    // Make sure that we always have enough lookahead, except
                    // at the end of the input file. We need MAX_MATCH bytes
                    // for the next match, plus MIN_MATCH bytes to insert the
                    // string following the next match.
                    while (lookahead < MIN_LOOKAHEAD && !eofile) {
                        fill_window();
                    }
                }
            }

            function init_deflate() {
                if (eofile) {
                    return;
                }
                bi_buf = 0;
                bi_valid = 0;
                ct_init();
                lm_init();

                qhead = null;
                outcnt = 0;
                outoff = 0;

                if (compr_level <= 3) {
                    prev_length = MIN_MATCH - 1;
                    match_length = 0;
                } else {
                    match_length = MIN_MATCH - 1;
                    match_available = false;
                }

                complete = false;
            }

            /* ==========================================================================
             * Same as above, but achieves better compression. We use a lazy
             * evaluation for matches: a match is finally adopted only if there is
             * no better match at the next window position.
             */
            function deflate_internal(buff, off, buff_size) {
                var n;

                if (!initflag) {
                    init_deflate();
                    initflag = true;
                    if (lookahead === 0) { // empty
                        complete = true;
                        return 0;
                    }
                }

                n = qcopy(buff, off, buff_size);
                if (n === buff_size) {
                    return buff_size;
                }

                if (complete) {
                    return n;
                }

                if (compr_level <= 3) {
                    // optimized for speed
                    deflate_fast();
                } else {
                    deflate_better();
                }

                if (lookahead === 0) {
                    if (match_available) {
                        ct_tally(0, window[strstart - 1] & 0xff);
                    }
                    flush_block(1);
                    complete = true;
                }

                return n + qcopy(buff, n + off, buff_size - n);
            }

            function qcopy(buff, off, buff_size) {
                var n, i, j;

                n = 0;
                while (qhead !== null && n < buff_size) {
                    i = buff_size - n;
                    if (i > qhead.len) {
                        i = qhead.len;
                    }
                    // System.arraycopy(qhead.ptr, qhead.off, buff, off + n, i);
                    for (j = 0; j < i; j++) {
                        buff[off + n + j] = qhead.ptr[qhead.off + j];
                    }

                    qhead.off += i;
                    qhead.len -= i;
                    n += i;
                    if (qhead.len === 0) {
                        var p;
                        p = qhead;
                        qhead = qhead.next;
                        reuse_queue(p);
                    }
                }

                if (n === buff_size) {
                    return n;
                }

                if (outoff < outcnt) {
                    i = buff_size - n;
                    if (i > outcnt - outoff) {
                        i = outcnt - outoff;
                    }
                    // System.arraycopy(outbuf, outoff, buff, off + n, i);
                    for (j = 0; j < i; j++) {
                        buff[off + n + j] = outbuf[outoff + j];
                    }
                    outoff += i;
                    n += i;
                    if (outcnt === outoff) {
                        outcnt = outoff = 0;
                    }
                }
                return n;
            }

            /* ==========================================================================
             * Allocate the match buffer, initialize the various tables and save the
             * location of the internal file attribute (ascii/binary) and method
             * (DEFLATE/STORE).
             */
            function ct_init() {
                var n; // iterates over tree elements
                var bits; // bit counter
                var length; // length value
                var code; // code value
                var dist; // distance index

                if (static_dtree[0].dl !== 0) {
                    return; // ct_init already called
                }

                l_desc.dyn_tree = dyn_ltree;
                l_desc.static_tree = static_ltree;
                l_desc.extra_bits = extra_lbits;
                l_desc.extra_base = LITERALS + 1;
                l_desc.elems = L_CODES;
                l_desc.max_length = MAX_BITS;
                l_desc.max_code = 0;

                d_desc.dyn_tree = dyn_dtree;
                d_desc.static_tree = static_dtree;
                d_desc.extra_bits = extra_dbits;
                d_desc.extra_base = 0;
                d_desc.elems = D_CODES;
                d_desc.max_length = MAX_BITS;
                d_desc.max_code = 0;

                bl_desc.dyn_tree = bl_tree;
                bl_desc.static_tree = null;
                bl_desc.extra_bits = extra_blbits;
                bl_desc.extra_base = 0;
                bl_desc.elems = BL_CODES;
                bl_desc.max_length = MAX_BL_BITS;
                bl_desc.max_code = 0;

                // Initialize the mapping length (0..255) -> length code (0..28)
                length = 0;
                for (code = 0; code < LENGTH_CODES - 1; code++) {
                    base_length[code] = length;
                    for (n = 0; n < (1 << extra_lbits[code]); n++) {
                        length_code[length++] = code;
                    }
                }
                // Assert (length === 256, "ct_init: length !== 256");

                // Note that the length 255 (match length 258) can be represented
                // in two different ways: code 284 + 5 bits or code 285, so we
                // overwrite length_code[255] to use the best encoding:
                length_code[length - 1] = code;

                // Initialize the mapping dist (0..32K) -> dist code (0..29) */
                dist = 0;
                for (code = 0; code < 16; code++) {
                    base_dist[code] = dist;
                    for (n = 0; n < (1 << extra_dbits[code]); n++) {
                        dist_code[dist++] = code;
                    }
                }
                // Assert (dist === 256, "ct_init: dist !== 256");
                // from now on, all distances are divided by 128
                for (dist >>= 7; code < D_CODES; code++) {
                    base_dist[code] = dist << 7;
                    for (n = 0; n < (1 << (extra_dbits[code] - 7)); n++) {
                        dist_code[256 + dist++] = code;
                    }
                }
                // Assert (dist === 256, "ct_init: 256+dist !== 512");

                // Construct the codes of the static literal tree
                for (bits = 0; bits <= MAX_BITS; bits++) {
                    bl_count[bits] = 0;
                }
                n = 0;
                while (n <= 143) {
                    static_ltree[n++].dl = 8;
                    bl_count[8]++;
                }
                while (n <= 255) {
                    static_ltree[n++].dl = 9;
                    bl_count[9]++;
                }
                while (n <= 279) {
                    static_ltree[n++].dl = 7;
                    bl_count[7]++;
                }
                while (n <= 287) {
                    static_ltree[n++].dl = 8;
                    bl_count[8]++;
                }
                // Codes 286 and 287 do not exist, but we must include them in the
                // tree construction to get a canonical Huffman tree (longest code
                // all ones)
                gen_codes(static_ltree, L_CODES + 1);

                // The static distance tree is trivial: */
                for (n = 0; n < D_CODES; n++) {
                    static_dtree[n].dl = 5;
                    static_dtree[n].fc = bi_reverse(n, 5);
                }

                // Initialize the first block of the first file:
                init_block();
            }

            /* ==========================================================================
             * Initialize a new block.
             */
            function init_block() {
                var n; // iterates over tree elements

                // Initialize the trees.
                for (n = 0; n < L_CODES; n++) {
                    dyn_ltree[n].fc = 0;
                }
                for (n = 0; n < D_CODES; n++) {
                    dyn_dtree[n].fc = 0;
                }
                for (n = 0; n < BL_CODES; n++) {
                    bl_tree[n].fc = 0;
                }

                dyn_ltree[END_BLOCK].fc = 1;
                opt_len = static_len = 0;
                last_lit = last_dist = last_flags = 0;
                flags = 0;
                flag_bit = 1;
            }

            /* ==========================================================================
             * Restore the heap property by moving down the tree starting at node k,
             * exchanging a node with the smallest of its two sons if necessary, stopping
             * when the heap property is re-established (each father smaller than its
             * two sons).
             *
             * @param tree- tree to restore
             * @param k- node to move down
             */
            function pqdownheap(tree, k) {
                var v = heap[k],
                    j = k << 1; // left son of k

                while (j <= heap_len) {
                    // Set j to the smallest of the two sons:
                    if (j < heap_len && SMALLER(tree, heap[j + 1], heap[j])) {
                        j++;
                    }

                    // Exit if v is smaller than both sons
                    if (SMALLER(tree, v, heap[j])) {
                        break;
                    }

                    // Exchange v with the smallest son
                    heap[k] = heap[j];
                    k = j;

                    // And continue down the tree, setting j to the left son of k
                    j <<= 1;
                }
                heap[k] = v;
            }

            /* ==========================================================================
             * Compute the optimal bit lengths for a tree and update the total bit length
             * for the current block.
             * IN assertion: the fields freq and dad are set, heap[heap_max] and
             *    above are the tree nodes sorted by increasing frequency.
             * OUT assertions: the field len is set to the optimal bit length, the
             *     array bl_count contains the frequencies for each bit length.
             *     The length opt_len is updated; static_len is also updated if stree is
             *     not null.
             */
            function gen_bitlen(desc) { // the tree descriptor
                var tree = desc.dyn_tree;
                var extra = desc.extra_bits;
                var base = desc.extra_base;
                var max_code = desc.max_code;
                var max_length = desc.max_length;
                var stree = desc.static_tree;
                var h; // heap index
                var n, m; // iterate over the tree elements
                var bits; // bit length
                var xbits; // extra bits
                var f; // frequency
                var overflow = 0; // number of elements with bit length too large

                for (bits = 0; bits <= MAX_BITS; bits++) {
                    bl_count[bits] = 0;
                }

                // In a first pass, compute the optimal bit lengths (which may
                // overflow in the case of the bit length tree).
                tree[heap[heap_max]].dl = 0; // root of the heap

                for (h = heap_max + 1; h < HEAP_SIZE; h++) {
                    n = heap[h];
                    bits = tree[tree[n].dl].dl + 1;
                    if (bits > max_length) {
                        bits = max_length;
                        overflow++;
                    }
                    tree[n].dl = bits;
                    // We overwrite tree[n].dl which is no longer needed

                    if (n > max_code) {
                        continue; // not a leaf node
                    }

                    bl_count[bits]++;
                    xbits = 0;
                    if (n >= base) {
                        xbits = extra[n - base];
                    }
                    f = tree[n].fc;
                    opt_len += f * (bits + xbits);
                    if (stree !== null) {
                        static_len += f * (stree[n].dl + xbits);
                    }
                }
                if (overflow === 0) {
                    return;
                }

                // This happens for example on obj2 and pic of the Calgary corpus

                // Find the first bit length which could increase:
                do {
                    bits = max_length - 1;
                    while (bl_count[bits] === 0) {
                        bits--;
                    }
                    bl_count[bits]--; // move one leaf down the tree
                    bl_count[bits + 1] += 2; // move one overflow item as its brother
                    bl_count[max_length]--;
                    // The brother of the overflow item also moves one step up,
                    // but this does not affect bl_count[max_length]
                    overflow -= 2;
                } while (overflow > 0);

                // Now recompute all bit lengths, scanning in increasing frequency.
                // h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
                // lengths instead of fixing only the wrong ones. This idea is taken
                // from 'ar' written by Haruhiko Okumura.)
                for (bits = max_length; bits !== 0; bits--) {
                    n = bl_count[bits];
                    while (n !== 0) {
                        m = heap[--h];
                        if (m > max_code) {
                            continue;
                        }
                        if (tree[m].dl !== bits) {
                            opt_len += (bits - tree[m].dl) * tree[m].fc;
                            tree[m].fc = bits;
                        }
                        n--;
                    }
                }
            }

            /* ==========================================================================
             * Generate the codes for a given tree and bit counts (which need not be
             * optimal).
             * IN assertion: the array bl_count contains the bit length statistics for
             * the given tree and the field len is set for all tree elements.
             * OUT assertion: the field code is set for all tree elements of non
             *     zero code length.
             * @param tree- the tree to decorate
             * @param max_code- largest code with non-zero frequency
             */
            function gen_codes(tree, max_code) {
                var next_code = []; // new Array(MAX_BITS + 1); // next code value for each bit length
                var code = 0; // running code value
                var bits; // bit index
                var n; // code index

                // The distribution counts are first used to generate the code values
                // without bit reversal.
                for (bits = 1; bits <= MAX_BITS; bits++) {
                    code = ((code + bl_count[bits - 1]) << 1);
                    next_code[bits] = code;
                }

                // Check that the bit counts in bl_count are consistent. The last code
                // must be all ones.
                // Assert (code + encoder->bl_count[MAX_BITS]-1 === (1<<MAX_BITS)-1, "inconsistent bit counts");
                // Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

                for (n = 0; n <= max_code; n++) {
                    var len = tree[n].dl;
                    if (len === 0) {
                        continue;
                    }
                    // Now reverse the bits
                    tree[n].fc = bi_reverse(next_code[len]++, len);

                    // Tracec(tree !== static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ", n, (isgraph(n) ? n : ' '), len, tree[n].fc, next_code[len]-1));
                }
            }

            /* ==========================================================================
             * Construct one Huffman tree and assigns the code bit strings and lengths.
             * Update the total bit length for the current block.
             * IN assertion: the field freq is set for all tree elements.
             * OUT assertions: the fields len and code are set to the optimal bit length
             *     and corresponding code. The length opt_len is updated; static_len is
             *     also updated if stree is not null. The field max_code is set.
             */
            function build_tree(desc) { // the tree descriptor
                var tree = desc.dyn_tree;
                var stree = desc.static_tree;
                var elems = desc.elems;
                var n, m; // iterate over heap elements
                var max_code = -1; // largest code with non zero frequency
                var node = elems; // next internal node of the tree

                // Construct the initial heap, with least frequent element in
                // heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
                // heap[0] is not used.
                heap_len = 0;
                heap_max = HEAP_SIZE;

                for (n = 0; n < elems; n++) {
                    if (tree[n].fc !== 0) {
                        heap[++heap_len] = max_code = n;
                        depth[n] = 0;
                    } else {
                        tree[n].dl = 0;
                    }
                }

                // The pkzip format requires that at least one distance code exists,
                // and that at least one bit should be sent even if there is only one
                // possible code. So to avoid special checks later on we force at least
                // two codes of non zero frequency.
                while (heap_len < 2) {
                    var xnew = heap[++heap_len] = (max_code < 2 ? ++max_code : 0);
                    tree[xnew].fc = 1;
                    depth[xnew] = 0;
                    opt_len--;
                    if (stree !== null) {
                        static_len -= stree[xnew].dl;
                    }
                    // new is 0 or 1 so it does not have extra bits
                }
                desc.max_code = max_code;

                // The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
                // establish sub-heaps of increasing lengths:
                for (n = heap_len >> 1; n >= 1; n--) {
                    pqdownheap(tree, n);
                }

                // Construct the Huffman tree by repeatedly combining the least two
                // frequent nodes.
                do {
                    n = heap[SMALLEST];
                    heap[SMALLEST] = heap[heap_len--];
                    pqdownheap(tree, SMALLEST);

                    m = heap[SMALLEST]; // m = node of next least frequency

                    // keep the nodes sorted by frequency
                    heap[--heap_max] = n;
                    heap[--heap_max] = m;

                    // Create a new node father of n and m
                    tree[node].fc = tree[n].fc + tree[m].fc;
                    //	depth[node] = (char)(MAX(depth[n], depth[m]) + 1);
                    if (depth[n] > depth[m] + 1) {
                        depth[node] = depth[n];
                    } else {
                        depth[node] = depth[m] + 1;
                    }
                    tree[n].dl = tree[m].dl = node;

                    // and insert the new node in the heap
                    heap[SMALLEST] = node++;
                    pqdownheap(tree, SMALLEST);

                } while (heap_len >= 2);

                heap[--heap_max] = heap[SMALLEST];

                // At this point, the fields freq and dad are set. We can now
                // generate the bit lengths.
                gen_bitlen(desc);

                // The field len is now set, we can generate the bit codes
                gen_codes(tree, max_code);
            }

            /* ==========================================================================
             * Scan a literal or distance tree to determine the frequencies of the codes
             * in the bit length tree. Updates opt_len to take into account the repeat
             * counts. (The contribution of the bit length codes will be added later
             * during the construction of bl_tree.)
             *
             * @param tree- the tree to be scanned
             * @param max_code- and its largest code of non zero frequency
             */
            function scan_tree(tree, max_code) {
                var n, // iterates over all tree elements
                    prevlen = -1, // last emitted length
                    curlen, // length of current code
                    nextlen = tree[0].dl, // length of next code
                    count = 0, // repeat count of the current code
                    max_count = 7, // max repeat count
                    min_count = 4; // min repeat count

                if (nextlen === 0) {
                    max_count = 138;
                    min_count = 3;
                }
                tree[max_code + 1].dl = 0xffff; // guard

                for (n = 0; n <= max_code; n++) {
                    curlen = nextlen;
                    nextlen = tree[n + 1].dl;
                    if (++count < max_count && curlen === nextlen) {
                        continue;
                    } else if (count < min_count) {
                        bl_tree[curlen].fc += count;
                    } else if (curlen !== 0) {
                        if (curlen !== prevlen) {
                            bl_tree[curlen].fc++;
                        }
                        bl_tree[REP_3_6].fc++;
                    } else if (count <= 10) {
                        bl_tree[REPZ_3_10].fc++;
                    } else {
                        bl_tree[REPZ_11_138].fc++;
                    }
                    count = 0;
                    prevlen = curlen;
                    if (nextlen === 0) {
                        max_count = 138;
                        min_count = 3;
                    } else if (curlen === nextlen) {
                        max_count = 6;
                        min_count = 3;
                    } else {
                        max_count = 7;
                        min_count = 4;
                    }
                }
            }

            /* ==========================================================================
             * Send a literal or distance tree in compressed form, using the codes in
             * bl_tree.
             *
             * @param tree- the tree to be scanned
             * @param max_code- and its largest code of non zero frequency
             */
            function send_tree(tree, max_code) {
                var n; // iterates over all tree elements
                var prevlen = -1; // last emitted length
                var curlen; // length of current code
                var nextlen = tree[0].dl; // length of next code
                var count = 0; // repeat count of the current code
                var max_count = 7; // max repeat count
                var min_count = 4; // min repeat count

                // tree[max_code+1].dl = -1; */  /* guard already set */
                if (nextlen === 0) {
                    max_count = 138;
                    min_count = 3;
                }

                for (n = 0; n <= max_code; n++) {
                    curlen = nextlen;
                    nextlen = tree[n + 1].dl;
                    if (++count < max_count && curlen === nextlen) {
                        continue;
                    } else if (count < min_count) {
                        do {
                            SEND_CODE(curlen, bl_tree);
                        } while (--count !== 0);
                    } else if (curlen !== 0) {
                        if (curlen !== prevlen) {
                            SEND_CODE(curlen, bl_tree);
                            count--;
                        }
                        // Assert(count >= 3 && count <= 6, " 3_6?");
                        SEND_CODE(REP_3_6, bl_tree);
                        send_bits(count - 3, 2);
                    } else if (count <= 10) {
                        SEND_CODE(REPZ_3_10, bl_tree);
                        send_bits(count - 3, 3);
                    } else {
                        SEND_CODE(REPZ_11_138, bl_tree);
                        send_bits(count - 11, 7);
                    }
                    count = 0;
                    prevlen = curlen;
                    if (nextlen === 0) {
                        max_count = 138;
                        min_count = 3;
                    } else if (curlen === nextlen) {
                        max_count = 6;
                        min_count = 3;
                    } else {
                        max_count = 7;
                        min_count = 4;
                    }
                }
            }

            /* ==========================================================================
             * Construct the Huffman tree for the bit lengths and return the index in
             * bl_order of the last bit length code to send.
             */
            function build_bl_tree() {
                var max_blindex; // index of last bit length code of non zero freq

                // Determine the bit length frequencies for literal and distance trees
                scan_tree(dyn_ltree, l_desc.max_code);
                scan_tree(dyn_dtree, d_desc.max_code);

                // Build the bit length tree:
                build_tree(bl_desc);
                // opt_len now includes the length of the tree representations, except
                // the lengths of the bit lengths codes and the 5+5+4 bits for the counts.

                // Determine the number of bit length codes to send. The pkzip format
                // requires that at least 4 bit length codes be sent. (appnote.txt says
                // 3 but the actual value used is 4.)
                for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
                    if (bl_tree[bl_order[max_blindex]].dl !== 0) {
                        break;
                    }
                }
                // Update opt_len to include the bit length tree and counts */
                opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
                // Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
                // encoder->opt_len, encoder->static_len));

                return max_blindex;
            }

            /* ==========================================================================
             * Send the header for a block using dynamic Huffman trees: the counts, the
             * lengths of the bit length codes, the literal tree and the distance tree.
             * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
             */
            function send_all_trees(lcodes, dcodes, blcodes) { // number of codes for each tree
                var rank; // index in bl_order

                // Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
                // Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES, "too many codes");
                // Tracev((stderr, "\nbl counts: "));
                send_bits(lcodes - 257, 5); // not +255 as stated in appnote.txt
                send_bits(dcodes - 1, 5);
                send_bits(blcodes - 4, 4); // not -3 as stated in appnote.txt
                for (rank = 0; rank < blcodes; rank++) {
                    // Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
                    send_bits(bl_tree[bl_order[rank]].dl, 3);
                }

                // send the literal tree
                send_tree(dyn_ltree, lcodes - 1);

                // send the distance tree
                send_tree(dyn_dtree, dcodes - 1);
            }

            /* ==========================================================================
             * Determine the best encoding for the current block: dynamic trees, static
             * trees or store, and output the encoded block to the zip file.
             */
            function flush_block(eof) { // true if this is the last block for a file
                var opt_lenb, static_lenb, // opt_len and static_len in bytes
                    max_blindex, // index of last bit length code of non zero freq
                    stored_len, // length of input block
                    i;

                stored_len = strstart - block_start;
                flag_buf[last_flags] = flags; // Save the flags for the last 8 items

                // Construct the literal and distance trees
                build_tree(l_desc);
                // Tracev((stderr, "\nlit data: dyn %ld, stat %ld",
                // encoder->opt_len, encoder->static_len));

                build_tree(d_desc);
                // Tracev((stderr, "\ndist data: dyn %ld, stat %ld",
                // encoder->opt_len, encoder->static_len));
                // At this point, opt_len and static_len are the total bit lengths of
                // the compressed block data, excluding the tree representations.

                // Build the bit length tree for the above two trees, and get the index
                // in bl_order of the last bit length code to send.
                max_blindex = build_bl_tree();

                // Determine the best encoding. Compute first the block length in bytes
                opt_lenb = (opt_len + 3 + 7) >> 3;
                static_lenb = (static_len + 3 + 7) >> 3;

                //  Trace((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u dist %u ", opt_lenb, encoder->opt_len, static_lenb, encoder->static_len, stored_len, encoder->last_lit, encoder->last_dist));

                if (static_lenb <= opt_lenb) {
                    opt_lenb = static_lenb;
                }
                if (stored_len + 4 <= opt_lenb && block_start >= 0) { // 4: two words for the lengths
                    // The test buf !== NULL is only necessary if LIT_BUFSIZE > WSIZE.
                    // Otherwise we can't have processed more than WSIZE input bytes since
                    // the last block flush, because compression would have been
                    // successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
                    // transform a block into a stored block.
                    send_bits((STORED_BLOCK << 1) + eof, 3); /* send block type */
                    bi_windup(); /* align on byte boundary */
                    put_short(stored_len);
                    put_short(~stored_len);

                    // copy block
                    /*
                    	p = &window[block_start];
                    	for (i = 0; i < stored_len; i++) {
                    		put_byte(p[i]);
                    	}
                    */
                    for (i = 0; i < stored_len; i++) {
                        put_byte(window[block_start + i]);
                    }
                } else if (static_lenb === opt_lenb) {
                    send_bits((STATIC_TREES << 1) + eof, 3);
                    compress_block(static_ltree, static_dtree);
                } else {
                    send_bits((DYN_TREES << 1) + eof, 3);
                    send_all_trees(l_desc.max_code + 1, d_desc.max_code + 1, max_blindex + 1);
                    compress_block(dyn_ltree, dyn_dtree);
                }

                init_block();

                if (eof !== 0) {
                    bi_windup();
                }
            }

            /* ==========================================================================
             * Save the match info and tally the frequency counts. Return true if
             * the current block must be flushed.
             *
             * @param dist- distance of matched string
             * @param lc- (match length - MIN_MATCH) or unmatched char (if dist === 0)
             */
            function ct_tally(dist, lc) {
                l_buf[last_lit++] = lc;
                if (dist === 0) {
                    // lc is the unmatched char
                    dyn_ltree[lc].fc++;
                } else {
                    // Here, lc is the match length - MIN_MATCH
                    dist--; // dist = match distance - 1
                    // Assert((ush)dist < (ush)MAX_DIST && (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) && (ush)D_CODE(dist) < (ush)D_CODES,  "ct_tally: bad match");

                    dyn_ltree[length_code[lc] + LITERALS + 1].fc++;
                    dyn_dtree[D_CODE(dist)].fc++;

                    d_buf[last_dist++] = dist;
                    flags |= flag_bit;
                }
                flag_bit <<= 1;

                // Output the flags if they fill a byte
                if ((last_lit & 7) === 0) {
                    flag_buf[last_flags++] = flags;
                    flags = 0;
                    flag_bit = 1;
                }
                // Try to guess if it is profitable to stop the current block here
                if (compr_level > 2 && (last_lit & 0xfff) === 0) {
                    // Compute an upper bound for the compressed length
                    var out_length = last_lit * 8;
                    var in_length = strstart - block_start;
                    var dcode;

                    for (dcode = 0; dcode < D_CODES; dcode++) {
                        out_length += dyn_dtree[dcode].fc * (5 + extra_dbits[dcode]);
                    }
                    out_length >>= 3;
                    // Trace((stderr,"\nlast_lit %u, last_dist %u, in %ld, out ~%ld(%ld%%) ", encoder->last_lit, encoder->last_dist, in_length, out_length, 100L - out_length*100L/in_length));
                    if (last_dist < parseInt(last_lit / 2, 10) && out_length < parseInt(in_length / 2, 10)) {
                        return true;
                    }
                }
                return (last_lit === LIT_BUFSIZE - 1 || last_dist === DIST_BUFSIZE);
                // We avoid equality with LIT_BUFSIZE because of wraparound at 64K
                // on 16 bit machines and because stored blocks are restricted to
                // 64K-1 bytes.
            }

            /* ==========================================================================
             * Send the block data compressed using the given Huffman trees
             *
             * @param ltree- literal tree
             * @param dtree- distance tree
             */
            function compress_block(ltree, dtree) {
                var dist; // distance of matched string
                var lc; // match length or unmatched char (if dist === 0)
                var lx = 0; // running index in l_buf
                var dx = 0; // running index in d_buf
                var fx = 0; // running index in flag_buf
                var flag = 0; // current flags
                var code; // the code to send
                var extra; // number of extra bits to send

                if (last_lit !== 0) {
                    do {
                        if ((lx & 7) === 0) {
                            flag = flag_buf[fx++];
                        }
                        lc = l_buf[lx++] & 0xff;
                        if ((flag & 1) === 0) {
                            SEND_CODE(lc, ltree); /* send a literal byte */
                            //	Tracecv(isgraph(lc), (stderr," '%c' ", lc));
                        } else {
                            // Here, lc is the match length - MIN_MATCH
                            code = length_code[lc];
                            SEND_CODE(code + LITERALS + 1, ltree); // send the length code
                            extra = extra_lbits[code];
                            if (extra !== 0) {
                                lc -= base_length[code];
                                send_bits(lc, extra); // send the extra length bits
                            }
                            dist = d_buf[dx++];
                            // Here, dist is the match distance - 1
                            code = D_CODE(dist);
                            //	Assert (code < D_CODES, "bad d_code");

                            SEND_CODE(code, dtree); // send the distance code
                            extra = extra_dbits[code];
                            if (extra !== 0) {
                                dist -= base_dist[code];
                                send_bits(dist, extra); // send the extra distance bits
                            }
                        } // literal or match pair ?
                        flag >>= 1;
                    } while (lx < last_lit);
                }

                SEND_CODE(END_BLOCK, ltree);
            }

            /* ==========================================================================
             * Send a value on a given number of bits.
             * IN assertion: length <= 16 and value fits in length bits.
             *
             * @param value- value to send
             * @param length- number of bits
             */
            var Buf_size = 16; // bit size of bi_buf
            function send_bits(value, length) {
                // If not enough room in bi_buf, use (valid) bits from bi_buf and
                // (16 - bi_valid) bits from value, leaving (width - (16-bi_valid))
                // unused bits in value.
                if (bi_valid > Buf_size - length) {
                    bi_buf |= (value << bi_valid);
                    put_short(bi_buf);
                    bi_buf = (value >> (Buf_size - bi_valid));
                    bi_valid += length - Buf_size;
                } else {
                    bi_buf |= value << bi_valid;
                    bi_valid += length;
                }
            }

            /* ==========================================================================
             * Reverse the first len bits of a code, using straightforward code (a faster
             * method would use a table)
             * IN assertion: 1 <= len <= 15
             *
             * @param code- the value to invert
             * @param len- its bit length
             */
            function bi_reverse(code, len) {
                var res = 0;
                do {
                    res |= code & 1;
                    code >>= 1;
                    res <<= 1;
                } while (--len > 0);
                return res >> 1;
            }

            /* ==========================================================================
             * Write out any remaining bits in an incomplete byte.
             */
            function bi_windup() {
                if (bi_valid > 8) {
                    put_short(bi_buf);
                } else if (bi_valid > 0) {
                    put_byte(bi_buf);
                }
                bi_buf = 0;
                bi_valid = 0;
            }

            function qoutbuf() {
                var q, i;
                if (outcnt !== 0) {
                    q = new_queue();
                    if (qhead === null) {
                        qhead = qtail = q;
                    } else {
                        qtail = qtail.next = q;
                    }
                    q.len = outcnt - outoff;
                    // System.arraycopy(outbuf, outoff, q.ptr, 0, q.len);
                    for (i = 0; i < q.len; i++) {
                        q.ptr[i] = outbuf[outoff + i];
                    }
                    outcnt = outoff = 0;
                }
            }

            function deflate(arr, level) {
                var i, j, buff;

                deflate_data = arr;
                deflate_pos = 0;
                if (typeof level === "undefined") {
                    level = DEFAULT_LEVEL;
                }
                deflate_start(level);

                buff = [];

                do {
                    i = deflate_internal(buff, buff.length, 1024);
                } while (i > 0);

                deflate_data = null; // G.C.
                return buff;
            }

            module.exports = deflate;
            module.exports.DEFAULT_LEVEL = DEFAULT_LEVEL;
        }());

}, {}],
    5: [function (require, module, exports) {
        /*
         * $Id: createGzipStreamMinified.js,v 1.1 2015/05/20 09:30:43 spotham Exp $
         *
         * original:
         * http://www.onicos.com/staff/iz/amuse/javascript/expert/inflate.txt
         */

        /* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
         * Version: 1.0.0.1
         * LastModified: Dec 25 1999
         */

        /* Interface:
         * data = inflate(src);
         */

        (function () {
            /* constant parameters */
            var WSIZE = 32768, // Sliding Window size
                STORED_BLOCK = 0,
                STATIC_TREES = 1,
                DYN_TREES = 2,

                /* for inflate */
                lbits = 9, // bits in base literal/length lookup table
                dbits = 6, // bits in base distance lookup table

                /* variables (inflate) */
                slide,
                wp, // current position in slide
                fixed_tl = null, // inflate static
                fixed_td, // inflate static
                fixed_bl, // inflate static
                fixed_bd, // inflate static
                bit_buf, // bit buffer
                bit_len, // bits in bit buffer
                method,
                eof,
                copy_leng,
                copy_dist,
                tl, // literal length decoder table
                td, // literal distance decoder table
                bl, // number of bits decoded by tl
                bd, // number of bits decoded by td

                inflate_data,
                inflate_pos,


                /* constant tables (inflate) */
                MASK_BITS = [
			0x0000,
			0x0001, 0x0003, 0x0007, 0x000f, 0x001f, 0x003f, 0x007f, 0x00ff,
			0x01ff, 0x03ff, 0x07ff, 0x0fff, 0x1fff, 0x3fff, 0x7fff, 0xffff
		],
                // Tables for deflate from PKZIP's appnote.txt.
                // Copy lengths for literal codes 257..285
                cplens = [
			3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
			35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
		],
                /* note: see note #13 above about the 258 in this list. */
                // Extra bits for literal codes 257..285
                cplext = [
			0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2,
			3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 99, 99 // 99==invalid
		],
                // Copy offsets for distance codes 0..29
                cpdist = [
			1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
			257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
			8193, 12289, 16385, 24577
		],
                // Extra bits for distance codes
                cpdext = [
			0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6,
			7, 7, 8, 8, 9, 9, 10, 10, 11, 11,
			12, 12, 13, 13
		],
                // Order of the bit length code lengths
                border = [
			16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15
		];
            /* objects (inflate) */

            function HuftList() {
                this.next = null;
                this.list = null;
            }

            function HuftNode() {
                this.e = 0; // number of extra bits or operation
                this.b = 0; // number of bits in this code or subcode

                // union
                this.n = 0; // literal, length base, or distance base
                this.t = null; // (HuftNode) pointer to next level of table
            }

            /*
             * @param b-  code lengths in bits (all assumed <= BMAX)
             * @param n- number of codes (assumed <= N_MAX)
             * @param s- number of simple-valued codes (0..s-1)
             * @param d- list of base values for non-simple codes
             * @param e- list of extra bits for non-simple codes
             * @param mm- maximum lookup bits
             */
            function HuftBuild(b, n, s, d, e, mm) {
                this.BMAX = 16; // maximum bit length of any code
                this.N_MAX = 288; // maximum number of codes in any set
                this.status = 0; // 0: success, 1: incomplete table, 2: bad input
                this.root = null; // (HuftList) starting table
                this.m = 0; // maximum lookup bits, returns actual

                /* Given a list of code lengths and a maximum table size, make a set of
                   tables to decode that set of codes. Return zero on success, one if
                   the given code set is incomplete (the tables are still built in this
                   case), two if the input is invalid (all zero length codes or an
                   oversubscribed set of lengths), and three if not enough memory.
                   The code with value 256 is special, and the tables are constructed
                   so that no bits beyond that code are fetched when that code is
                   decoded. */
                var a; // counter for codes of length k
                var c = [];
                var el; // length of EOB code (value 256)
                var f; // i repeats in table every f entries
                var g; // maximum code length
                var h; // table level
                var i; // counter, current code
                var j; // counter
                var k; // number of bits in current code
                var lx = [];
                var p; // pointer into c[], b[], or v[]
                var pidx; // index of p
                var q; // (HuftNode) points to current table
                var r = new HuftNode(); // table entry for structure assignment
                var u = [];
                var v = [];
                var w;
                var x = [];
                var xp; // pointer into x or c
                var y; // number of dummy codes added
                var z; // number of entries in current table
                var o;
                var tail; // (HuftList)

                tail = this.root = null;

                // bit length count table
                for (i = 0; i < this.BMAX + 1; i++) {
                    c[i] = 0;
                }
                // stack of bits per table
                for (i = 0; i < this.BMAX + 1; i++) {
                    lx[i] = 0;
                }
                // HuftNode[BMAX][]  table stack
                for (i = 0; i < this.BMAX; i++) {
                    u[i] = null;
                }
                // values in order of bit length
                for (i = 0; i < this.N_MAX; i++) {
                    v[i] = 0;
                }
                // bit offsets, then code stack
                for (i = 0; i < this.BMAX + 1; i++) {
                    x[i] = 0;
                }

                // Generate counts for each bit length
                el = n > 256 ? b[256] : this.BMAX; // set length of EOB code, if any
                p = b;
                pidx = 0;
                i = n;
                do {
                    c[p[pidx]]++; // assume all entries <= BMAX
                    pidx++;
                } while (--i > 0);
                if (c[0] === n) { // null input--all zero length codes
                    this.root = null;
                    this.m = 0;
                    this.status = 0;
                    return;
                }

                // Find minimum and maximum length, bound *m by those
                for (j = 1; j <= this.BMAX; j++) {
                    if (c[j] !== 0) {
                        break;
                    }
                }
                k = j; // minimum code length
                if (mm < j) {
                    mm = j;
                }
                for (i = this.BMAX; i !== 0; i--) {
                    if (c[i] !== 0) {
                        break;
                    }
                }
                g = i; // maximum code length
                if (mm > i) {
                    mm = i;
                }

                // Adjust last length count to fill out codes, if needed
                for (y = 1 << j; j < i; j++, y <<= 1) {
                    if ((y -= c[j]) < 0) {
                        this.status = 2; // bad input: more codes than bits
                        this.m = mm;
                        return;
                    }
                }
                if ((y -= c[i]) < 0) {
                    this.status = 2;
                    this.m = mm;
                    return;
                }
                c[i] += y;

                // Generate starting offsets into the value table for each length
                x[1] = j = 0;
                p = c;
                pidx = 1;
                xp = 2;
                while (--i > 0) { // note that i == g from above
                    x[xp++] = (j += p[pidx++]);
                }

                // Make a table of values in order of bit lengths
                p = b;
                pidx = 0;
                i = 0;
                do {
                    if ((j = p[pidx++]) !== 0) {
                        v[x[j]++] = i;
                    }
                } while (++i < n);
                n = x[g]; // set n to length of v

                // Generate the Huffman codes and for each, make the table entries
                x[0] = i = 0; // first Huffman code is zero
                p = v;
                pidx = 0; // grab values in bit order
                h = -1; // no tables yet--level -1
                w = lx[0] = 0; // no bits decoded yet
                q = null; // ditto
                z = 0; // ditto

                // go through the bit lengths (k already is bits in shortest code)
                for (null; k <= g; k++) {
                    a = c[k];
                    while (a-- > 0) {
                        // here i is the Huffman code of length k bits for value p[pidx]
                        // make tables up to required level
                        while (k > w + lx[1 + h]) {
                            w += lx[1 + h]; // add bits already decoded
                            h++;

                            // compute minimum size table less than or equal to *m bits
                            z = (z = g - w) > mm ? mm : z; // upper limit
                            if ((f = 1 << (j = k - w)) > a + 1) { // try a k-w bit table
                                // too few codes for k-w bit table
                                f -= a + 1; // deduct codes from patterns left
                                xp = k;
                                while (++j < z) { // try smaller tables up to z bits
                                    if ((f <<= 1) <= c[++xp]) {
                                        break; // enough codes to use up j bits
                                    }
                                    f -= c[xp]; // else deduct codes from patterns
                                }
                            }
                            if (w + j > el && w < el) {
                                j = el - w; // make EOB code end at table
                            }
                            z = 1 << j; // table entries for j-bit table
                            lx[1 + h] = j; // set table size in stack

                            // allocate and link in new table
                            q = [];
                            for (o = 0; o < z; o++) {
                                q[o] = new HuftNode();
                            }

                            if (!tail) {
                                tail = this.root = new HuftList();
                            } else {
                                tail = tail.next = new HuftList();
                            }
                            tail.next = null;
                            tail.list = q;
                            u[h] = q; // table starts after link

                            /* connect to last table, if there is one */
                            if (h > 0) {
                                x[h] = i; // save pattern for backing up
                                r.b = lx[h]; // bits to dump before this table
                                r.e = 16 + j; // bits in this table
                                r.t = q; // pointer to this table
                                j = (i & ((1 << w) - 1)) >> (w - lx[h]);
                                u[h - 1][j].e = r.e;
                                u[h - 1][j].b = r.b;
                                u[h - 1][j].n = r.n;
                                u[h - 1][j].t = r.t;
                            }
                        }

                        // set up table entry in r
                        r.b = k - w;
                        if (pidx >= n) {
                            r.e = 99; // out of values--invalid code
                        } else if (p[pidx] < s) {
                            r.e = (p[pidx] < 256 ? 16 : 15); // 256 is end-of-block code
                            r.n = p[pidx++]; // simple code is just the value
                        } else {
                            r.e = e[p[pidx] - s]; // non-simple--look up in lists
                            r.n = d[p[pidx++] - s];
                        }

                        // fill code-like entries with r //
                        f = 1 << (k - w);
                        for (j = i >> w; j < z; j += f) {
                            q[j].e = r.e;
                            q[j].b = r.b;
                            q[j].n = r.n;
                            q[j].t = r.t;
                        }

                        // backwards increment the k-bit code i
                        for (j = 1 << (k - 1);
                            (i & j) !== 0; j >>= 1) {
                            i ^= j;
                        }
                        i ^= j;

                        // backup over finished tables
                        while ((i & ((1 << w) - 1)) !== x[h]) {
                            w -= lx[h]; // don't need to update q
                            h--;
                        }
                    }
                }

                /* return actual size of base table */
                this.m = lx[1];

                /* Return true (1) if we were given an incomplete table */
                this.status = ((y !== 0 && g !== 1) ? 1 : 0);
            }


            /* routines (inflate) */

            function GET_BYTE() {
                if (inflate_data.length === inflate_pos) {
                    return -1;
                }
                return inflate_data[inflate_pos++] & 0xff;
            }

            function NEEDBITS(n) {
                while (bit_len < n) {
                    bit_buf |= GET_BYTE() << bit_len;
                    bit_len += 8;
                }
            }

            function GETBITS(n) {
                return bit_buf & MASK_BITS[n];
            }

            function DUMPBITS(n) {
                bit_buf >>= n;
                bit_len -= n;
            }

            function inflate_codes(buff, off, size) {
                // inflate (decompress) the codes in a deflated (compressed) block.
                // Return an error code or zero if it all goes ok.
                var e; // table entry flag/number of extra bits
                var t; // (HuftNode) pointer to table entry
                var n;

                if (size === 0) {
                    return 0;
                }

                // inflate the coded data
                n = 0;
                for (;;) { // do until end of block
                    NEEDBITS(bl);
                    t = tl.list[GETBITS(bl)];
                    e = t.e;
                    while (e > 16) {
                        if (e === 99) {
                            return -1;
                        }
                        DUMPBITS(t.b);
                        e -= 16;
                        NEEDBITS(e);
                        t = t.t[GETBITS(e)];
                        e = t.e;
                    }
                    DUMPBITS(t.b);

                    if (e === 16) { // then it's a literal
                        wp &= WSIZE - 1;
                        buff[off + n++] = slide[wp++] = t.n;
                        if (n === size) {
                            return size;
                        }
                        continue;
                    }

                    // exit if end of block
                    if (e === 15) {
                        break;
                    }

                    // it's an EOB or a length

                    // get length of block to copy
                    NEEDBITS(e);
                    copy_leng = t.n + GETBITS(e);
                    DUMPBITS(e);

                    // decode distance of block to copy
                    NEEDBITS(bd);
                    t = td.list[GETBITS(bd)];
                    e = t.e;

                    while (e > 16) {
                        if (e === 99) {
                            return -1;
                        }
                        DUMPBITS(t.b);
                        e -= 16;
                        NEEDBITS(e);
                        t = t.t[GETBITS(e)];
                        e = t.e;
                    }
                    DUMPBITS(t.b);
                    NEEDBITS(e);
                    copy_dist = wp - t.n - GETBITS(e);
                    DUMPBITS(e);

                    // do the copy
                    while (copy_leng > 0 && n < size) {
                        copy_leng--;
                        copy_dist &= WSIZE - 1;
                        wp &= WSIZE - 1;
                        buff[off + n++] = slide[wp++] = slide[copy_dist++];
                    }

                    if (n === size) {
                        return size;
                    }
                }

                method = -1; // done
                return n;
            }

            function inflate_stored(buff, off, size) {
                /* "decompress" an inflated type 0 (stored) block. */
                var n;

                // go to byte boundary
                n = bit_len & 7;
                DUMPBITS(n);

                // get the length and its complement
                NEEDBITS(16);
                n = GETBITS(16);
                DUMPBITS(16);
                NEEDBITS(16);
                if (n !== ((~bit_buf) & 0xffff)) {
                    return -1; // error in compressed data
                }
                DUMPBITS(16);

                // read and output the compressed data
                copy_leng = n;

                n = 0;
                while (copy_leng > 0 && n < size) {
                    copy_leng--;
                    wp &= WSIZE - 1;
                    NEEDBITS(8);
                    buff[off + n++] = slide[wp++] = GETBITS(8);
                    DUMPBITS(8);
                }

                if (copy_leng === 0) {
                    method = -1; // done
                }
                return n;
            }

            function inflate_fixed(buff, off, size) {
                // decompress an inflated type 1 (fixed Huffman codes) block.  We should
                // either replace this with a custom decoder, or at least precompute the
                // Huffman tables.

                // if first time, set up tables for fixed blocks
                if (!fixed_tl) {
                    var i; // temporary variable
                    var l = []; // 288 length list for huft_build (initialized below)
                    var h; // HuftBuild

                    // literal table
                    for (i = 0; i < 144; i++) {
                        l[i] = 8;
                    }
                    for (null; i < 256; i++) {
                        l[i] = 9;
                    }
                    for (null; i < 280; i++) {
                        l[i] = 7;
                    }
                    for (null; i < 288; i++) { // make a complete, but wrong code set
                        l[i] = 8;
                    }
                    fixed_bl = 7;

                    h = new HuftBuild(l, 288, 257, cplens, cplext, fixed_bl);
                    if (h.status !== 0) {
                        console.error("HufBuild error: " + h.status);
                        return -1;
                    }
                    fixed_tl = h.root;
                    fixed_bl = h.m;

                    // distance table
                    for (i = 0; i < 30; i++) { // make an incomplete code set
                        l[i] = 5;
                    }
                    fixed_bd = 5;

                    h = new HuftBuild(l, 30, 0, cpdist, cpdext, fixed_bd);
                    if (h.status > 1) {
                        fixed_tl = null;
                        console.error("HufBuild error: " + h.status);
                        return -1;
                    }
                    fixed_td = h.root;
                    fixed_bd = h.m;
                }

                tl = fixed_tl;
                td = fixed_td;
                bl = fixed_bl;
                bd = fixed_bd;
                return inflate_codes(buff, off, size);
            }

            function inflate_dynamic(buff, off, size) {
                // decompress an inflated type 2 (dynamic Huffman codes) block.
                var i; // temporary variables
                var j;
                var l; // last length
                var n; // number of lengths to get
                var t; // (HuftNode) literal/length code table
                var nb; // number of bit length codes
                var nl; // number of literal/length codes
                var nd; // number of distance codes
                var ll = [];
                var h; // (HuftBuild)

                // literal/length and distance code lengths
                for (i = 0; i < 286 + 30; i++) {
                    ll[i] = 0;
                }

                // read in table lengths
                NEEDBITS(5);
                nl = 257 + GETBITS(5); // number of literal/length codes
                DUMPBITS(5);
                NEEDBITS(5);
                nd = 1 + GETBITS(5); // number of distance codes
                DUMPBITS(5);
                NEEDBITS(4);
                nb = 4 + GETBITS(4); // number of bit length codes
                DUMPBITS(4);
                if (nl > 286 || nd > 30) {
                    return -1; // bad lengths
                }

                // read in bit-length-code lengths
                for (j = 0; j < nb; j++) {
                    NEEDBITS(3);
                    ll[border[j]] = GETBITS(3);
                    DUMPBITS(3);
                }
                for (null; j < 19; j++) {
                    ll[border[j]] = 0;
                }

                // build decoding table for trees--single level, 7 bit lookup
                bl = 7;
                h = new HuftBuild(ll, 19, 19, null, null, bl);
                if (h.status !== 0) {
                    return -1; // incomplete code set
                }

                tl = h.root;
                bl = h.m;

                // read in literal and distance code lengths
                n = nl + nd;
                i = l = 0;
                while (i < n) {
                    NEEDBITS(bl);
                    t = tl.list[GETBITS(bl)];
                    j = t.b;
                    DUMPBITS(j);
                    j = t.n;
                    if (j < 16) { // length of code in bits (0..15)
                        ll[i++] = l = j; // save last length in l
                    } else if (j === 16) { // repeat last length 3 to 6 times
                        NEEDBITS(2);
                        j = 3 + GETBITS(2);
                        DUMPBITS(2);
                        if (i + j > n) {
                            return -1;
                        }
                        while (j-- > 0) {
                            ll[i++] = l;
                        }
                    } else if (j === 17) { // 3 to 10 zero length codes
                        NEEDBITS(3);
                        j = 3 + GETBITS(3);
                        DUMPBITS(3);
                        if (i + j > n) {
                            return -1;
                        }
                        while (j-- > 0) {
                            ll[i++] = 0;
                        }
                        l = 0;
                    } else { // j === 18: 11 to 138 zero length codes
                        NEEDBITS(7);
                        j = 11 + GETBITS(7);
                        DUMPBITS(7);
                        if (i + j > n) {
                            return -1;
                        }
                        while (j-- > 0) {
                            ll[i++] = 0;
                        }
                        l = 0;
                    }
                }

                // build the decoding tables for literal/length and distance codes
                bl = lbits;
                h = new HuftBuild(ll, nl, 257, cplens, cplext, bl);
                if (bl === 0) { // no literals or lengths
                    h.status = 1;
                }
                if (h.status !== 0) {
                    if (h.status !== 1) {
                        return -1; // incomplete code set
                    }
                    // **incomplete literal tree**
                }
                tl = h.root;
                bl = h.m;

                for (i = 0; i < nd; i++) {
                    ll[i] = ll[i + nl];
                }
                bd = dbits;
                h = new HuftBuild(ll, nd, 0, cpdist, cpdext, bd);
                td = h.root;
                bd = h.m;

                if (bd === 0 && nl > 257) { // lengths but no distances
                    // **incomplete distance tree**
                    return -1;
                }
                /*
                		if (h.status === 1) {
                			// **incomplete distance tree**
                		}
                */
                if (h.status !== 0) {
                    return -1;
                }

                // decompress until an end-of-block code
                return inflate_codes(buff, off, size);
            }

            function inflate_start() {
                if (!slide) {
                    slide = []; // new Array(2 * WSIZE); // slide.length is never called
                }
                wp = 0;
                bit_buf = 0;
                bit_len = 0;
                method = -1;
                eof = false;
                copy_leng = copy_dist = 0;
                tl = null;
            }

            function inflate_internal(buff, off, size) {
                // decompress an inflated entry
                var n, i;

                n = 0;
                while (n < size) {
                    if (eof && method === -1) {
                        return n;
                    }

                    if (copy_leng > 0) {
                        if (method !== STORED_BLOCK) {
                            // STATIC_TREES or DYN_TREES
                            while (copy_leng > 0 && n < size) {
                                copy_leng--;
                                copy_dist &= WSIZE - 1;
                                wp &= WSIZE - 1;
                                buff[off + n++] = slide[wp++] = slide[copy_dist++];
                            }
                        } else {
                            while (copy_leng > 0 && n < size) {
                                copy_leng--;
                                wp &= WSIZE - 1;
                                NEEDBITS(8);
                                buff[off + n++] = slide[wp++] = GETBITS(8);
                                DUMPBITS(8);
                            }
                            if (copy_leng === 0) {
                                method = -1; // done
                            }
                        }
                        if (n === size) {
                            return n;
                        }
                    }

                    if (method === -1) {
                        if (eof) {
                            break;
                        }

                        // read in last block bit
                        NEEDBITS(1);
                        if (GETBITS(1) !== 0) {
                            eof = true;
                        }
                        DUMPBITS(1);

                        // read in block type
                        NEEDBITS(2);
                        method = GETBITS(2);
                        DUMPBITS(2);
                        tl = null;
                        copy_leng = 0;
                    }

                    switch (method) {
                        case STORED_BLOCK:
                            i = inflate_stored(buff, off + n, size - n);
                            break;

                        case STATIC_TREES:
                            if (tl) {
                                i = inflate_codes(buff, off + n, size - n);
                            } else {
                                i = inflate_fixed(buff, off + n, size - n);
                            }
                            break;

                        case DYN_TREES:
                            if (tl) {
                                i = inflate_codes(buff, off + n, size - n);
                            } else {
                                i = inflate_dynamic(buff, off + n, size - n);
                            }
                            break;

                        default: // error
                            i = -1;
                            break;
                    }

                    if (i === -1) {
                        if (eof) {
                            return 0;
                        }
                        return -1;
                    }
                    n += i;
                }
                return n;
            }

            function inflate(arr) {
                var buff = [],
                    i;

                inflate_start();
                inflate_data = arr;
                inflate_pos = 0;

                do {
                    i = inflate_internal(buff, buff.length, 1024);
                } while (i > 0);
                inflate_data = null; // G.C.
                return buff;
            }

            module.exports = inflate;
        }());

}, {}],
    "createGzipStream": [function (require, module, exports) {
        'use strict';

        module.exports = {

            createToGzipStream: function (input, fncomplete) {
                /*
                		var parseString = require('xml2js').parseString;
                		//var xml = "<root>Hello xml2js!</root>"
                		parseString(xml, function (err, result) {
                						//console.dir(result);
                						fncomplete(result);
                		});
                */
                var gzip = require('gzip-js'),
                    options = {};

                /*
                options = {
                	level: 3,
                	name: 'hello-world.txt',
                	timestamp: parseInt(Date.now() / 1000, 10)
                };
                */
                // out will be a JavaScript Array of bytes
                //var out = gzip.zip(input, options);
                
                var out = gzip.zip(input, options);
                return out;
            }
        };

}, {
        "gzip-js": 1
    }]
}, {}, []);
