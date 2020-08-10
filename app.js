const fs = require('fs');
const path = require('path');
const colors = require('colors');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function main() {
    const dirpath = process.argv[2];
    if (!dirpath) {
        console.log('please specify a directory.');
        return;
    }
    console.log(`processing ${dirpath}`);
    await traverseToFindNodeModulesDirs(dirpath);
}

async function traverse(aPath, visit) {
    const baseName = path.basename(aPath);
    if (baseName.startsWith('.')) {
        return;
    }
    const stat = await fs.promises.stat(aPath);
    const result = await visit(baseName, aPath, stat);
    if (result === false) {
        return;
    }
    if (stat.isDirectory()) {
        const childEntries = await fs.promises.readdir(aPath);
        for (let childEntry of childEntries) {
            const childEntryPath = path.join(aPath, childEntry);
            await traverse(childEntryPath, visit);
        }
    } else if (stat.isFile()) {
        /*Ignore*/
    } else {
        throw new Error('this is not a file or a Directory');
    }
}

async function traverseToFindNodeModulesDirs(dirpath) {
    await traverse(dirpath, async (baseName, aPath, stat) => {
        if (baseName.startsWith('.')) {
            return false;
        } else if (baseName === 'node_modules') {
            await processNodeModulesFolders(aPath);
            return false;
        } else if (aPath === '/Users/mac/Library') {
            return false;
        }
    });
}

const calculateDiskUsage = async function (dirpath) {
    let total = 0;
    await traverse(dirpath, (baseName, aPath, stat) => {
        if (stat.isFile()) {
            total += stat.size;
        }
    });
    return total;
}

/*
async function traverseToFindNodeModulesDirs(dirpath) {
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
                        await processNodeModulesFolders(entryPath);
                        console.log(`found ${entryPath} occupies ${size} shouldDelete ${shouldDelete}`);
                    } else if (entryPath === '/Users/mac/Library') {
                        // Ignore those files
                    } else {
                        await traverseToFindNodeModulesDirs(entryPath);
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
*/

const processNodeModulesFolders = async function (nodeModulesDirPath) {
    const projectPath = path.dirname(nodeModulesDirPath);
    const lastModified = await getProjectLastModifiedDate(projectPath);
    const parentDirStat = await fs.promises.stat(projectPath);
    const size = await calculateDiskUsage(nodeModulesDirPath);
    const now = new Date();
    const sevenDays = (1000 * 60 * 60 * 24) * 7;
    const shouldDelete = now - lastModified > sevenDays;
    const message = `found ${nodeModulesDirPath} ocupies ${size} shouldDelete ${shouldDelete}`;
    if (shouldDelete) {
        const command = `rm -rf "${nodeModulesDirPath}"`;
        await exec(command);
        console.log(colors.red(message));
        console.log(colors.cyan(command));
    } else {
        console.log(colors.green(message));
    }
}

const getProjectLastModifiedDate = async function (projectPath) {
    let lastModified;
    await traverse(projectPath, (baseName, aPath, stat) => {
        if (baseName === 'node_modules') {
            return false;
        } else if (baseName.startsWith('.')) {
            return false;
        } else if (stat.isFile()) {
            if (!lastModified) {
                lastModified = stat.mtime;
            } else if (stat.mtime > lastModified) {
                lastModified = stat.mtime;
            }
        }
    });
    return lastModified;
}

/*
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
*/

main().catch(err => console.log(err.stack));
