import { localFiles, centralDirectories, endCentralDirectory } from './interface/index';
import { bufferToStream, streamToBlob, readString, msdosTimeToDate } from '../utils/index';

export class UnZipJs {
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

    #dataview: DataView;
    #indexLocal = 0;
    #globalIndex: number = 0;
    #localFiles: Array<localFiles> = [];
    #centralDirectories: Array<centralDirectories> = []; 
    #endOfCentralDirectory: any = null;

    constructor(ArrayBuffer: ArrayBuffer) {
        this.#dataview = new DataView(ArrayBuffer);
        this.read();
    }

    public async extractZip(entry: localFiles): Promise<Blob> {
        const buffer: ArrayBuffer = this.#dataview.buffer.slice(entry.startsAt, entry.startsAt + entry.compressedSize);
        if(entry.compressionMethod === 0x00){
            return new Blob([buffer]);
        } else if (entry.compressionMethod === 0x08){
            const descompressedStream = new DecompressionStream("deflate-raw");
            const stream = bufferToStream(buffer);
            const readAbleStream = stream.pipeThrough(descompressedStream);
            return await streamToBlob(readAbleStream);
        } else {
            throw new Error('Compression method not supported');
        }
    };

    read(): void {
        try {
            let indexList: Array<number> = [];
            while(!this.#endOfCentralDirectory){
                const signature = this.#dataview.getUint32(this.#globalIndex, true);
                if(signature === 0x04034b50){
                    const entry = this.readLocalFiles(this.#globalIndex);
                    entry.startsAt = this.#globalIndex + 30 + entry.fileNameLength + entry.extraLength;
                    entry.extract = this.extractZip.bind(this, entry);
                    this.#localFiles.push(entry);
                    this.#indexLocal = entry.startsAt + entry.compressedSize;
                    indexList.push(this.#indexLocal);
                    this.#globalIndex = 0;
                    for(const index in indexList){
                        if(Number(index) === Number(indexList.length - 1)){
                            this.#globalIndex += indexList[index];
                        }
                    }
                } else if(signature === 0x02014b50){
                    const entry: centralDirectories = this.readCentralDirectories(this.#globalIndex);
                    this.#centralDirectories.push(entry);
                    this.#globalIndex += 46 + entry.fileNameLength + entry.extraLength + entry.fileCommentLength;
                } else if(signature === 0x06054b50){
                    this.#endOfCentralDirectory = this.readEndOfCentralDirectory(this.#globalIndex);
                } else {
                    break;
                }
            }
        } catch (error) {
            console.error(error);
        }
    }; 

    private readLocalFiles(offset: number): localFiles {
        const fileNameLength = this.#dataview.getUint16(offset + 26, true);
        const extraLength = this.#dataview.getUint16(offset + 28, true);

        const entry: localFiles = {
            signature: readString(this.#dataview, offset, 4),
            version: this.#dataview.getUint16(offset + 4, true),
            generalPurpose: this.#dataview.getUint16(offset + 6, true),
            compressionMethod: this.#dataview.getUint16(offset + 8, true),
            lastModifiedTime: this.#dataview.getUint16(offset + 10, true),
            lastModifiedDate: this.#dataview.getUint16(offset + 12, true),
            lastModified: '',
            crc: this.#dataview.getUint32(offset + 14, true),
            compressedSize: this.#dataview.getUint32(offset + 18, true),
            uncompressedSize: this.#dataview.getUint32(offset + 22, true),
            fileNameLength,
            fileName: readString(this.#dataview, offset + 30, fileNameLength),
            extraLength,
            extra: readString(this.#dataview, offset + 30 + fileNameLength, extraLength),
            startsAt: 0
        };

        entry.lastModified = msdosTimeToDate(entry.lastModifiedDate, entry.lastModifiedTime).toString();

        return entry;
    };

    private readCentralDirectories(offset: number): centralDirectories {
        const fileNameLength = this.#dataview.getUint16(offset + 28, true);
        const extraLength = this.#dataview.getUint16(offset + 30, true);
        const fileCommentLength = this.#dataview.getUint16(offset + 32, true);

        const entry: centralDirectories = {
            signature: readString(this.#dataview, offset, 4),
            versionCreated: this.#dataview.getUint16(offset + 4, true),
            versionNeeded: this.#dataview.getUint16(offset + 6, true),
            generalPurpose: this.#dataview.getUint16(offset + 8, true),
            compressionMethod: this.#dataview.getUint16(offset + 10, true),
            lastModifiedTime: this.#dataview.getUint16(offset + 12, true),
            lastModifiedDate: this.#dataview.getUint16(offset + 14, true),
            crc: this.#dataview.getUint32(offset + 16, true),
            compressedSize: this.#dataview.getUint32(offset + 20, true),
            uncompressedSize: this.#dataview.getUint32(offset + 24, true),
            fileNameLength,
            extraLength,
            fileCommentLength,
            diskNumber: this.#dataview.getUint16(offset + 34, true),
            internalAttributes: this.#dataview.getUint16(offset + 36, true),
            externalAttributes: this.#dataview.getUint32(offset + 38, true),
            offset: this.#dataview.getUint32(offset + 42, true),
            fileName: readString(this.#dataview, offset + 46, fileNameLength),
            extra: readString(this.#dataview, offset + 46 + fileNameLength, extraLength),
            comments: this.#dataview.getUint16(offset + 46 + fileNameLength + extraLength, true)
        };

        return entry;
    };

    private readEndOfCentralDirectory(offset: number): endCentralDirectory {
        const commentLength = this.#dataview.getUint16(offset + 20, true);
        const entry: endCentralDirectory = {
            signature: readString(this.#dataview, offset, 4),
            numberOfDisks: this.#dataview.getUint16(offset + 4, true),
            centralDirectoryStartDisk: this.#dataview.getUint16(offset + 6, true),
            numberCentralDirectoryRecordsOnThisDisk: this.#dataview.getUint16(offset + 8, true),
            numberCentralDirectoryRecords: this.#dataview.getUint16(offset + 10, true),
            centralDirectorySize: this.#dataview.getUint32(offset + 12, true),
            centralDirectoryOffset: this.#dataview.getUint32(offset + 16, true),
            commentLength,
            comment: readString(this.#dataview, offset + 22, commentLength)
        };

        return entry;
    };

    get entries(): Array<localFiles> {
        return this.#localFiles;
    };
};