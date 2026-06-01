const fs = require('fs');
const path = require('path');

const folders = ['app', 'components', 'hooks', 'services', 'lib'];
const fileExtensions = ['.js', '.jsx'];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Helper to check if JSDoc already exists right above
    const hasJSDoc = (offset) => {
        const prevText = content.substring(Math.max(0, offset - 150), offset);
        // If there's a */ with only whitespace/newlines between it and the function
        return /\*\/\s*$/.test(prevText);
    };

    // 1. export default function X(props)
    const exportDefaultRegex = /^(\s*)(export\s+default\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*\{)/gm;
    content = content.replace(exportDefaultRegex, (match, space, fullMatch, name, args, offset) => {
        if (hasJSDoc(offset + space.length)) return match;
        modified = true;
        const isComponent = name[0] === name[0].toUpperCase();
        let jsdoc = `/**\n * ${isComponent ? 'Component' : 'Hàm'} ${name}\n * Đảm nhiệm việc hiển thị giao diện và xử lý logic tương ứng.\n *\n`;
        if (args && args.trim().length > 0) {
            jsdoc += ` * @param {Object} ${args.split(',')[0].trim().replace(/[{}]/g, '')} - Tham số đầu vào\n`;
        }
        jsdoc += ` * @returns {${isComponent ? 'JSX.Element' : 'any'}}\n */\n`;
        return `${space}${jsdoc}${fullMatch}`;
    });

    // 2. export function X(props)
    const exportFunctionRegex = /^(\s*)(export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*\{)/gm;
    content = content.replace(exportFunctionRegex, (match, space, fullMatch, name, args, offset) => {
        if (hasJSDoc(offset + space.length)) return match;
        modified = true;
        const isComponent = name[0] === name[0].toUpperCase();
        let jsdoc = `/**\n * ${isComponent ? 'Component' : 'Hàm'} ${name}\n * Xử lý logic và chức năng liên quan.\n *\n`;
        if (args && args.trim().length > 0) {
            const firstArg = args.split(',')[0].trim().replace(/[{}]/g, '');
            jsdoc += ` * @param {any} ${firstArg} - Tham số đầu vào\n`;
        }
        jsdoc += ` * @returns {${isComponent ? 'JSX.Element' : 'any'}}\n */\n`;
        return `${space}${jsdoc}${fullMatch}`;
    });

    // 3. export const X = (props) => 
    const exportConstRegex = /^(\s*)(export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>\s*\{)/gm;
    content = content.replace(exportConstRegex, (match, space, fullMatch, name, args, offset) => {
        if (hasJSDoc(offset + space.length)) return match;
        modified = true;
        const isComponent = name[0] === name[0].toUpperCase();
        let jsdoc = `/**\n * ${isComponent ? 'Component' : 'Hàm mũi tên (Arrow Function)'} ${name}\n * Xử lý logic nghiệp vụ hoặc hiển thị.\n *\n`;
        if (args && args.trim().length > 0) {
            const firstArg = args.split(',')[0].trim().replace(/[{}]/g, '');
            jsdoc += ` * @param {any} ${firstArg} - Tham số đầu vào\n`;
        }
        jsdoc += ` * @returns {${isComponent ? 'JSX.Element' : 'any'}}\n */\n`;
        return `${space}${jsdoc}${fullMatch}`;
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Đã thêm JSDoc: ${filePath}`);
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (fileExtensions.includes(path.extname(fullPath))) {
            processFile(fullPath);
        }
    }
}

folders.forEach(folder => {
    const folderPath = path.join(__dirname, folder);
    if (fs.existsSync(folderPath)) {
        traverseDir(folderPath);
    }
});
console.log('Hoàn tất chuẩn hóa JSDoc!');
