export interface localFiles {
    signature: string,
    version: number,
    generalPurpose: number,
    compressionMethod: number,
    lastModifiedTime: number,
    lastModifiedDate: number,
    lastModified: string,
    crc: number,
    compressedSize: number,
    uncompressedSize: number,
    fileNameLength: number,
    fileName: string,
    extraLength: number,
    extra: string,
    startsAt: number,
    [key: string]: any
}

export interface centralDirectories {
    signature: string,
    versionCreated: number,
    versionNeeded: number,
    generalPurpose: number,
    compressionMethod: number,
    lastModifiedTime: number,
    lastModifiedDate: number,
    crc: number,
    compressedSize: number,
    uncompressedSize: number,
    fileNameLength: number,
    extraLength: number,
    fileCommentLength: number,
    diskNumber: number,
    internalAttributes: number,
    externalAttributes: number,
    offset: number,
    fileName: string,
    extra: string,
    comments: number
}

export interface endCentralDirectory {
    signature: string,
    numberOfDisks: number,
    centralDirectoryStartDisk: number,
    numberCentralDirectoryRecordsOnThisDisk: number,
    numberCentralDirectoryRecords: number,
    centralDirectorySize: number,
    centralDirectoryOffset: number,
    commentLength: number,
    comment: string
}

export interface entryPoint extends localFiles {
    extract: () => void
} 
