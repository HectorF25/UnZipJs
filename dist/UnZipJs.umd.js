(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.UnZipJs = {}));
})(this, (function (exports) { 'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol, Iterator */


    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __classPrivateFieldGet(receiver, state, kind, f) {
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    }

    function __classPrivateFieldSet(receiver, state, value, kind, f) {
        if (kind === "m") throw new TypeError("Private method is not writable");
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
        return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    function msdosTimeToDate(date, time) {
        const day = date & 0x1F;
        const month = (date >> 5 & 0x0F) - 1;
        const year = 1980 + (date >> 9 & 0x7F);
        const seconds = time & 0x1F * 2;
        const minutes = time >> 5 & 0x3F;
        const hours = time >> 11 & 0x1F;
        return new Date(year, month, day, hours, minutes, seconds);
    }
    function readString(view, offset, length) {
        let str = '';
        for (let i = 0; i < length; i++) {
            str += String.fromCharCode(view.getUint8(offset + i));
        }
        return str;
    }
    function bufferToStream(buffer) {
        return new ReadableStream({
            start(controller) {
                controller.enqueue(new Uint8Array(buffer));
                controller.close();
            }
        });
    }
    function streamToBlob(stream_1) {
        return __awaiter(this, arguments, void 0, function* (stream, type = 'application/octet-stream') {
            const reader = stream.getReader();
            const chunks = [];
            let done = false;
            while (!done) {
                const result = yield reader.read();
                done = result.done;
                if (result.value) {
                    chunks.push(result === null || result === void 0 ? void 0 : result.value);
                }
            }
            return new Blob(chunks, { type });
        });
    }

    var _UnZipJs_dataview, _UnZipJs_indexLocal, _UnZipJs_globalIndex, _UnZipJs_localFiles, _UnZipJs_centralDirectories, _UnZipJs_endOfCentralDirectory;
    class UnZipJs {
        constructor(ArrayBuffer) {
            /**
             * @param {ArrayBuffer} buffer
             * @returns {Promise<void>}
             * @memberof Zip
             * @description Unzips a zip file with the given password and returns the files in the zip
             * @example
             * const zip = new Zip();
             * zip.unzip(buffer, password).then(files => {
             *    console.log(files);
             * });
            */
            _UnZipJs_dataview.set(this, void 0);
            _UnZipJs_indexLocal.set(this, 0);
            _UnZipJs_globalIndex.set(this, 0);
            _UnZipJs_localFiles.set(this, []);
            _UnZipJs_centralDirectories.set(this, []);
            _UnZipJs_endOfCentralDirectory.set(this, null);
            __classPrivateFieldSet(this, _UnZipJs_dataview, new DataView(ArrayBuffer), "f");
            this.read();
        }
        extractZip(entry) {
            return __awaiter(this, void 0, void 0, function* () {
                const buffer = __classPrivateFieldGet(this, _UnZipJs_dataview, "f").buffer.slice(entry.startsAt, entry.startsAt + entry.compressedSize);
                if (entry.compressionMethod === 0x00) {
                    return new Blob([buffer]);
                }
                else if (entry.compressionMethod === 0x08) {
                    const descompressedStream = new DecompressionStream("deflate-raw");
                    const stream = bufferToStream(buffer);
                    const readAbleStream = stream.pipeThrough(descompressedStream);
                    return yield streamToBlob(readAbleStream);
                }
                else {
                    throw new Error('Compression method not supported');
                }
            });
        }
        ;
        read() {
            try {
                let indexList = [];
                while (!__classPrivateFieldGet(this, _UnZipJs_endOfCentralDirectory, "f")) {
                    const signature = __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint32(__classPrivateFieldGet(this, _UnZipJs_globalIndex, "f"), true);
                    if (signature === 0x04034b50) {
                        const entry = this.readLocalFiles(__classPrivateFieldGet(this, _UnZipJs_globalIndex, "f"));
                        entry.startsAt = __classPrivateFieldGet(this, _UnZipJs_globalIndex, "f") + 30 + entry.fileNameLength + entry.extraLength;
                        entry.extract = this.extractZip.bind(this, entry);
                        __classPrivateFieldGet(this, _UnZipJs_localFiles, "f").push(entry);
                        __classPrivateFieldSet(this, _UnZipJs_indexLocal, entry.startsAt + entry.compressedSize, "f");
                        indexList.push(__classPrivateFieldGet(this, _UnZipJs_indexLocal, "f"));
                        __classPrivateFieldSet(this, _UnZipJs_globalIndex, 0, "f");
                        for (const index in indexList) {
                            if (Number(index) === Number(indexList.length - 1)) {
                                __classPrivateFieldSet(this, _UnZipJs_globalIndex, __classPrivateFieldGet(this, _UnZipJs_globalIndex, "f") + indexList[index], "f");
                            }
                        }
                    }
                    else if (signature === 0x02014b50) {
                        const entry = this.readCentralDirectories(__classPrivateFieldGet(this, _UnZipJs_globalIndex, "f"));
                        __classPrivateFieldGet(this, _UnZipJs_centralDirectories, "f").push(entry);
                        __classPrivateFieldSet(this, _UnZipJs_globalIndex, __classPrivateFieldGet(this, _UnZipJs_globalIndex, "f") + (46 + entry.fileNameLength + entry.extraLength + entry.fileCommentLength), "f");
                    }
                    else if (signature === 0x06054b50) {
                        __classPrivateFieldSet(this, _UnZipJs_endOfCentralDirectory, this.readEndOfCentralDirectory(__classPrivateFieldGet(this, _UnZipJs_globalIndex, "f")), "f");
                    }
                    else {
                        break;
                    }
                }
            }
            catch (error) {
                console.error(error);
            }
        }
        ;
        readLocalFiles(offset) {
            const fileNameLength = __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 26, true);
            const extraLength = __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 28, true);
            const entry = {
                signature: readString(__classPrivateFieldGet(this, _UnZipJs_dataview, "f"), offset, 4),
                version: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 4, true),
                generalPurpose: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 6, true),
                compressionMethod: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 8, true),
                lastModifiedTime: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 10, true),
                lastModifiedDate: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 12, true),
                lastModified: '',
                crc: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint32(offset + 14, true),
                compressedSize: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint32(offset + 18, true),
                uncompressedSize: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint32(offset + 22, true),
                fileNameLength,
                fileName: readString(__classPrivateFieldGet(this, _UnZipJs_dataview, "f"), offset + 30, fileNameLength),
                extraLength,
                extra: readString(__classPrivateFieldGet(this, _UnZipJs_dataview, "f"), offset + 30 + fileNameLength, extraLength),
                startsAt: 0
            };
            entry.lastModified = msdosTimeToDate(entry.lastModifiedDate, entry.lastModifiedTime).toString();
            return entry;
        }
        ;
        readCentralDirectories(offset) {
            const fileNameLength = __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 28, true);
            const extraLength = __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 30, true);
            const fileCommentLength = __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 32, true);
            const entry = {
                signature: readString(__classPrivateFieldGet(this, _UnZipJs_dataview, "f"), offset, 4),
                versionCreated: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 4, true),
                versionNeeded: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 6, true),
                generalPurpose: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 8, true),
                compressionMethod: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 10, true),
                lastModifiedTime: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 12, true),
                lastModifiedDate: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 14, true),
                crc: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint32(offset + 16, true),
                compressedSize: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint32(offset + 20, true),
                uncompressedSize: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint32(offset + 24, true),
                fileNameLength,
                extraLength,
                fileCommentLength,
                diskNumber: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 34, true),
                internalAttributes: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 36, true),
                externalAttributes: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint32(offset + 38, true),
                offset: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint32(offset + 42, true),
                fileName: readString(__classPrivateFieldGet(this, _UnZipJs_dataview, "f"), offset + 46, fileNameLength),
                extra: readString(__classPrivateFieldGet(this, _UnZipJs_dataview, "f"), offset + 46 + fileNameLength, extraLength),
                comments: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 46 + fileNameLength + extraLength, true)
            };
            return entry;
        }
        ;
        readEndOfCentralDirectory(offset) {
            const commentLength = __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 20, true);
            const entry = {
                signature: readString(__classPrivateFieldGet(this, _UnZipJs_dataview, "f"), offset, 4),
                numberOfDisks: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 4, true),
                centralDirectoryStartDisk: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 6, true),
                numberCentralDirectoryRecordsOnThisDisk: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 8, true),
                numberCentralDirectoryRecords: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint16(offset + 10, true),
                centralDirectorySize: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint32(offset + 12, true),
                centralDirectoryOffset: __classPrivateFieldGet(this, _UnZipJs_dataview, "f").getUint32(offset + 16, true),
                commentLength,
                comment: readString(__classPrivateFieldGet(this, _UnZipJs_dataview, "f"), offset + 22, commentLength)
            };
            return entry;
        }
        ;
        get entries() {
            return __classPrivateFieldGet(this, _UnZipJs_localFiles, "f");
        }
        ;
    }
    _UnZipJs_dataview = new WeakMap(), _UnZipJs_indexLocal = new WeakMap(), _UnZipJs_globalIndex = new WeakMap(), _UnZipJs_localFiles = new WeakMap(), _UnZipJs_centralDirectories = new WeakMap(), _UnZipJs_endOfCentralDirectory = new WeakMap();

    exports.UnZipJs = UnZipJs;

}));
