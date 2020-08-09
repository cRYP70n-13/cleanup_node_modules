const fs = require('fs');
const path = require('path');

async function main() {
    const dirpath = process.argv[2];
    if (!dirpath) {
        console.log('please specify a directory.');
        return;
    }
    console.log(`processing ${dirpath}`);
    await traverse(dirpath);
}

async function traverse(dirpath) {
    const childEntries = await fs.promises.readdir(dirpath);
    for (let entry of childEntries) {
        if (entry.startsWith('.')) {
            continue;
        } else {
            const entryPath = path.join(dirpath, entry);
            try {
                const stat = await fs.promises.stat(entryPath);
                if (stat.isDirectory()) {
                    if (entry === 'node_modules') {
                        console.log(`found ${entryPath}`);
                        const size = await calculateDiskUsage(entryPath);
                        console.log('       occupies', size);
                    } else if (entryPath === '/Users/mac/Library') {
                        // Ignore those files
                    } else {
                        await traverse(entryPath);
                    }
                } else if (stat.isFile()) {
                    //console.log(`processing ${entry}`, stat);
                    // Ignore
                } else {
                    throw new Error("this is a fucking domny shit");
                }
            } catch {
                // ignoring the errors to let the code runs
            }
        }
    }
}

const calculateDiskUsage = async function (entryPath) {
    // console.log('calculateDiskUsage ', entryPath);
    const stat = await fs.promises.stat(entryPath);
    if (stat.isDirectory()) {
        // console.log(`${entryPath} is Directory`);
        const childEntries = await fs.promises.readdir(entryPath);
        // console.log(entryPath);
        let total = 0;
        for (let childEntry of childEntries) {
            const childEntryPath = path.join(entryPath, childEntry);
            total += await calculateDiskUsage(childEntryPath);
        }
        return total;
    } else if (stat.isFile()) {
        // console.log(`${entryPath} is a File`);
        return stat.size;
    } else {
        // console.log(`neither a file or a directory`);
        throw new Error('this is the error');
    }
}

main().catch(err => console.log(err.stack));
