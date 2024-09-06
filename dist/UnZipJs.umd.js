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

    class UnZipJs {
        constructor(ArrayBuffer) {
            this.globalIndex = 0;
            this.localFiles = [];
            this.centralDirectories = [];
            this.endOfCentralDirectory = null;
            this.dataview = new DataView(ArrayBuffer);
            this.read();
        }
        extractZip(entry) {
            return __awaiter(this, void 0, void 0, function* () {
                const buffer = this.dataview.buffer.slice(entry.startsAt, entry.startsAt + entry.compressedSize);
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
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let indexList = [];
                    while (!this.endOfCentralDirectory) {
                        const signature = this.dataview.getUint32(this.globalIndex);
                        if (signature === 0x04034b50) {
                            const entry = this.readLocalFiles(this.globalIndex);
                            entry.startsAt = this.globalIndex + 30 + entry.fileNameLength + entry.extraLength;
                            entry.extract = this.extractZip.bind(this, entry);
                            this.localFiles.push(entry);
                            indexList.push(this.globalIndex);
                            this.globalIndex = 0;
                            for (const index of indexList) {
                                if (index === indexList.length - 1) {
                                    this.globalIndex += indexList[index];
                                }
                            }
                        }
                        else if (signature === 0x02014b50) {
                            const entry = this.readCentralDirectories(this.globalIndex);
                            this.centralDirectories.push(entry);
                            this.globalIndex += 46 + entry.fileNameLength + entry.extraLength + entry.fileCommentLength;
                        }
                        else if (signature === 0x06054b50) {
                            this.endOfCentralDirectory = this.readEndOfCentralDirectory(this.globalIndex);
                        }
                        else {
                            break;
                        }
                    }
                }
                catch (error) {
                    console.error(error);
                }
            });
        }
        ;
        readLocalFiles(offset) {
            const fileNameLength = this.dataview.getUint16(offset + 26, true);
            const extraLength = this.dataview.getUint16(offset + 28, true);
            const entry = {
                signature: readString(this.dataview, offset, 4),
                version: this.dataview.getUint16(offset + 4, true),
                generalPurpose: this.dataview.getUint16(offset + 6, true),
                compressionMethod: this.dataview.getUint16(offset + 8, true),
                lastModifiedTime: this.dataview.getUint16(offset + 10, true),
                lastModifiedDate: this.dataview.getUint16(offset + 12, true),
                lastModified: '',
                crc: this.dataview.getUint32(offset + 14, true),
                compressedSize: this.dataview.getUint32(offset + 18, true),
                uncompressedSize: this.dataview.getUint32(offset + 22, true),
                fileNameLength,
                fileName: readString(this.dataview, offset + 30, fileNameLength),
                extraLength,
                extra: readString(this.dataview, offset + 30 + fileNameLength, extraLength),
                startsAt: 0
            };
            entry.lastModified = msdosTimeToDate(entry.lastModifiedDate, entry.lastModifiedTime).toString();
            return entry;
        }
        ;
        readCentralDirectories(offset) {
            const fileNameLength = this.dataview.getUint16(offset + 28, true);
            const extraLength = this.dataview.getUint16(offset + 30, true);
            const fileCommentLength = this.dataview.getUint16(offset + 32, true);
            const entry = {
                signature: readString(this.dataview, offset, 4),
                versionCreated: this.dataview.getUint16(offset + 4, true),
                versionNeeded: this.dataview.getUint16(offset + 6, true),
                generalPurpose: this.dataview.getUint16(offset + 8, true),
                compressionMethod: this.dataview.getUint16(offset + 10, true),
                lastModifiedTime: this.dataview.getUint16(offset + 12, true),
                lastModifiedDate: this.dataview.getUint16(offset + 14, true),
                crc: this.dataview.getUint32(offset + 16, true),
                compressedSize: this.dataview.getUint32(offset + 20, true),
                uncompressedSize: this.dataview.getUint32(offset + 24, true),
                fileNameLength,
                extraLength,
                fileCommentLength,
                diskNumber: this.dataview.getUint16(offset + 34, true),
                internalAttributes: this.dataview.getUint16(offset + 36, true),
                externalAttributes: this.dataview.getUint32(offset + 38, true),
                offset: this.dataview.getUint32(offset + 42, true),
                fileName: readString(this.dataview, offset + 46, fileNameLength),
                extra: readString(this.dataview, offset + 46 + fileNameLength, extraLength),
                comments: this.dataview.getUint16(offset + 46 + fileNameLength + extraLength, true)
            };
            return entry;
        }
        ;
        readEndOfCentralDirectory(offset) {
            const commentLength = this.dataview.getUint16(offset + 20, true);
            const entry = {
                signature: readString(this.dataview, offset, 4),
                numberOfDisks: this.dataview.getUint16(offset + 4, true),
                centralDirectoryStartDisk: this.dataview.getUint16(offset + 6, true),
                numberCentralDirectoryRecordsOnThisDisk: this.dataview.getUint16(offset + 8, true),
                numberCentralDirectoryRecords: this.dataview.getUint16(offset + 10, true),
                centralDirectorySize: this.dataview.getUint32(offset + 12, true),
                centralDirectoryOffset: this.dataview.getUint32(offset + 16, true),
                commentLength,
                comment: readString(this.dataview, offset + 22, commentLength)
            };
            return entry;
        }
        ;
        get entries() {
            return this.localFiles;
        }
        ;
    }

    exports.UnZipJs = UnZipJs;

}));
