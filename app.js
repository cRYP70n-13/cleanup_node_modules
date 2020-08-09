const fs = require('fs');
const path = require('path');

async function main() {
    const dirpath = process.argv[2];
    if (!dirpath) {
        console.log('please specify a directory.');
        return;
    }
    console.log(`processing ${dirpath}`);
    traverse(dirpath);
}

async function traverse(dirpath) {
    const childEntries = await fs.promises.readdir(dirpath);
    for (let entry of childEntries) {
        if (entry.startsWith('.')) {
            continue;
        } else {
            const entryPath = path.join(dirpath, entry);
            const stat = await fs.promises.stat(entryPath);
            if (stat.isDirectory()) {
                traverse(entryPath);
            } else if (stat.isFile()) {
                console.log(`processing ${entry}`, stat);
            } else {
                throw new Error("this is a fucking domny shit");
            }
        }
    }
}

main().catch(console.log);
