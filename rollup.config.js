import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import path from 'path';
import fs from 'fs';
const pkg = require('./package.json');

// Dynamically generate the input configuration for Rollup.
const libraryFolders = fs.readdirSync('libraries').filter(file => fs.statSync(path.join('libraries', file)).isDirectory());

// Generate output configuration for each library
const outputConfig = libraryFolders.flatMap(folder => [
    {
        input: `libraries/${folder}/index.ts`,
        output: {
            file: `dist/${folder}.umd.js`,
            format: 'umd',
            name: folder.replace(/-\w/g, m => m[1].toUpperCase()), // Convert kebab-case to CamelCase
        },
        plugins: [
            resolve(),
            commonjs(),
            typescript(),
            babel({
                babelHelpers: 'bundled',
                exclude: ["node_modules/**"],
            }),
        ]
    },
    {
        input: `libraries/${folder}/index.ts`,
        output: [
            { file: pkg.main, format: "cjs" },
            { file: pkg.module, format: "es" },
        ],
        plugins: [
            resolve(),
            commonjs(),
            typescript(),
            babel({
                babelHelpers: 'bundled',
                exclude: ["node_modules/**"],
            }),
        ]
    }
]);

export default outputConfig;
