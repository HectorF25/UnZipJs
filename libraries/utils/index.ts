export function msdosTimeToDate (date: number, time: number): Date {
    const day = date & 0x1F;
    const month = (date >> 5 & 0x0F) - 1;
    const year = 1980 + (date >> 9 & 0x7F);
    const seconds = time & 0x1F * 2;
    const minutes = time >> 5 & 0x3F;
    const hours = time >> 11 & 0x1F;
    return new Date(year, month, day, hours, minutes, seconds);
}

export function unixTimestampToDate(timestamp: number) {
    return new Date(timestamp * 1000);
}

export function readString(view: DataView, offset: number, length: number): string {
    let str = '';
    for (let i = 0; i < length; i++) {
        str += String.fromCharCode(view.getUint8(offset + i));
    }
    return str;
}

export function readUint8(view: DataView, offset: number): number {
    return view.getUint8(offset);
}

export function readUint16(view: DataView, offset: number): number {
    return view.getUint16(offset, true);
}

export function readUint32(view: DataView, offset: number): number {
    return view.getUint32(offset, true);
}

export function bufferToStream(buffer: ArrayBuffer): ReadableStream {
    return new ReadableStream({
        start(controller) {
            controller.enqueue(new Uint8Array(buffer));
            controller.close();
        }
    });
}

export async function streamToBlob(stream: ReadableStream<Uint8Array>, type: string = 'application/octet-stream'): Promise<Blob> {
    const reader: ReadableStreamDefaultReader<Uint8Array> = stream.getReader();
    const chunks: Uint8Array[] = [];
    let done: boolean = false;
    while(!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
            chunks.push(result?.value);
        }
    }
    return new Blob(chunks, { type });
}

export async function downloadArrayBuffer(arrayBuffer: ArrayBuffer, type: string, fileName: string): Promise<void> {
    const blob = new Blob([arrayBuffer], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}