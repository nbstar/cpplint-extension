import { spawnSync } from "child_process";
import * as vscode from 'vscode';
import { ConfigManager } from "./configuration";

export function runOnFile(filename: string, workspaces: string[]) {
    let result = runCppLint(filename, workspaces, false);
    return result;
}

export function runOnWorkspace(workspaces: string[]) {
    let result = runCppLint(null, workspaces, true);
    return result;
}

function runCppLint(filename: string, workspaces: string[], enableworkspace: boolean) {
    let config = ConfigManager.getInstance().getConfig();
    let cpplint = config["cpplintPath"];
    let linelength = "--linelength=" + config['lineLength'];
    let param: string[] = ['--output=vs7', linelength];

    if (config['excludes'].length != 0) {
        config['excludes'].forEach(element => {
            param.push("--exclude=" + element)
        });
    }

    if (config['filters'].length != 0) {
        param.push("--filter=" + config["filters"].join(','))
    }

    if (config["extensions"].length != 0) {
        param.push("--extensions=" + config["extensions"].join(','))
    }

    if (config["headers"].length != 0) {
        param.push("--headers=" + config["headers"].join(','))
    }

    param.push("--verbose=" + config['verbose']);

    if (enableworkspace) {
        let out = [];
        for (let workspace of workspaces) {
            out.push("Scan workspace: " + workspace);
            let workspaceparam = param;
            if (config['repository'].length != 0) {
                workspaceparam.push("--repository=" + config["repository"].replace("${workspaceFloder}", workspace));
            }

            if (config['root'].length != 0) {
                workspaceparam.push("--root=" + config["root"].replace("${workspaceFolder}", workspace));
            }
            workspaceparam = workspaceparam.concat(["--recursive", workspace]);

            let output = lint(cpplint, workspaceparam);
            out = output;
        }
        return out.join('\n');

    } else {
        let workspace = ""
        if (workspaces != null) {
            workspace = workspaces[0];
        }

        if (config['repository'].length != 0) {
            param.push("--repository=" + config["repository"].replace("${workspaceFolder}", workspace));
        }

        if (config['root'].length != 0) {
            param.push("--root=" + config["root"].replace("${workspaceFolder}", workspace));
        }

        param.push(filename);
        let output = lint(cpplint, param);
        let end = 'CppLint ended: ' + new Date().toString();
        let out = output;
        return out.join('\n');
    }
}

function lint(exec: string, params: string[]) {
    let result = spawnSync(exec, params)
    let stdout = result.stdout;
    let stderr = result.stderr;
    let out = [result.stdout, result.stderr]
    return out;
}