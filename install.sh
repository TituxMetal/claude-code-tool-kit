#!/bin/bash

# Claude Code Tool Kit Installer
# Version: 2.0.0
# Description: Installs skills, commands, agents, hooks, and configuration for Claude Code

set -euo pipefail

# Constants
readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly VERSION="2.0.0"

# Installation paths
readonly CLAUDE_DIR="${HOME}/.claude"
readonly SKILLS_DIR="${CLAUDE_DIR}/skills"
readonly COMMANDS_DIR="${CLAUDE_DIR}/commands"
readonly AGENTS_DIR="${CLAUDE_DIR}/agents"
readonly HOOKS_DIR="${CLAUDE_DIR}/tool-kit-hooks"
readonly HOOKS_SCRIPTS_DIR="${HOOKS_DIR}/scripts"

# Color codes
readonly COLOR_RED='\033[0;31m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_RESET='\033[0m'

# Global variables
declare -g installSuccess=true
declare -g hasWarnings=false

# -----------------------------------------------------------------------------
# Output Functions
# -----------------------------------------------------------------------------

printInfo() {
  echo -e "${COLOR_BLUE}[INFO]${COLOR_RESET} $*"
}

printSuccess() {
  echo -e "${COLOR_GREEN}[OK]${COLOR_RESET} $*"
}

printWarning() {
  echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $*"
  hasWarnings=true
}

printError() {
  echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $*" >&2
  installSuccess=false
}

printHeader() {
  echo "============================================="
  echo "  Claude Code Tool Kit"
  echo "  Installation Script v${VERSION}"
  echo "============================================="
  echo
}

# -----------------------------------------------------------------------------
# Utility Functions
# -----------------------------------------------------------------------------

confirmAction() {
  local prompt="${1:-Are you sure?}"
  local response

  read -p "${prompt} (y/N): " -n 1 -r response
  echo
  [[ "$response" =~ ^[Yy]$ ]]
}

# -----------------------------------------------------------------------------
# Validation Functions
# -----------------------------------------------------------------------------

validateSourceFiles() {
  local requiredDirs=("skills" "commands" "agents" "hooks" "hooks/scripts")

  for dir in "${requiredDirs[@]}"; do
    [[ -d "${SCRIPT_DIR}/${dir}" ]] || {
      printError "Required directory not found: ${dir}"
      return 1
    }
  done

  [[ -f "${SCRIPT_DIR}/CLAUDE.md" ]] || {
    printError "CLAUDE.md not found"
    return 1
  }

  [[ -f "${SCRIPT_DIR}/hooks/package.json" ]] || {
    printError "hooks/package.json not found"
    return 1
  }

  printSuccess "All source files found"
  return 0
}

# -----------------------------------------------------------------------------
# Installation Functions
# -----------------------------------------------------------------------------

createDirectory() {
  local dir="$1"

  [[ -d "$dir" ]] && {
    printInfo "Directory already exists: ${dir}"
    return 0
  }

  mkdir -p "$dir" && {
    printSuccess "Created directory: ${dir}"
    return 0
  }

  printError "Failed to create directory: ${dir}"
  return 1
}

copyFileWithConfirmation() {
  local source="$1"
  local destination="$2"
  local filename
  filename=$(basename "$source")

  [[ -f "$source" ]] || {
    printError "Source file not found: ${source}"
    return 1
  }

  [[ ! -f "$destination" ]] && {
    cp "$source" "$destination" && {
      printSuccess "Copied ${filename}"
      return 0
    }
    printError "Failed to copy ${filename}"
    return 1
  }

  printWarning "File already exists: ${destination}"
  confirmAction "Overwrite?" || {
    printInfo "Skipping ${filename}"
    return 0
  }

  cp "$source" "$destination" && {
    printSuccess "Copied ${filename}"
    return 0
  }

  printError "Failed to copy ${filename}"
  return 1
}

copyDirWithConfirmation() {
  local source="$1"
  local destDir="$2"
  local dirname
  dirname=$(basename "$source")
  local destination="${destDir}/${dirname}"

  [[ -d "$source" ]] || {
    printError "Source directory not found: ${source}"
    return 1
  }

  [[ ! -d "$destination" ]] && {
    cp -r "$source" "$destDir/" && {
      printSuccess "Copied ${dirname}/"
      return 0
    }
    printError "Failed to copy ${dirname}/"
    return 1
  }

  printWarning "Directory already exists: ${destination}"
  confirmAction "Overwrite?" || {
    printInfo "Skipping ${dirname}/"
    return 0
  }

  rm -rf "$destination"
  cp -r "$source" "$destDir/" && {
    printSuccess "Copied ${dirname}/"
    return 0
  }

  printError "Failed to copy ${dirname}/"
  return 1
}

installSkills() {
  printInfo "Installing skills..."

  local count=0
  for skillDir in "${SCRIPT_DIR}/skills"/*; do
    [[ -d "$skillDir" ]] || continue
    copyDirWithConfirmation "$skillDir" "$SKILLS_DIR"
    ((count++))
  done

  printInfo "Installed ${count} skills"
  echo
  return 0
}

installCommands() {
  printInfo "Installing commands..."

  local count=0
  for cmdFile in "${SCRIPT_DIR}/commands"/*.md; do
    [[ -f "$cmdFile" ]] || continue
    local filename
    filename=$(basename "$cmdFile")
    copyFileWithConfirmation "$cmdFile" "${COMMANDS_DIR}/${filename}"
    ((count++))
  done

  printInfo "Installed ${count} commands"
  echo
  return 0
}

installAgents() {
  printInfo "Installing agents..."

  local count=0
  for agentFile in "${SCRIPT_DIR}/agents"/*.md; do
    [[ -f "$agentFile" ]] || continue
    local filename
    filename=$(basename "$agentFile")
    copyFileWithConfirmation "$agentFile" "${AGENTS_DIR}/${filename}"
    ((count++))
  done

  printInfo "Installed ${count} agents"
  echo
  return 0
}

installClaudeMd() {
  printInfo "Installing CLAUDE.md..."
  copyFileWithConfirmation "${SCRIPT_DIR}/CLAUDE.md" "${CLAUDE_DIR}/CLAUDE.md"
  echo
  return 0
}

installHooks() {
  printInfo "Installing hooks..."

  command -v jq &>/dev/null || {
    printWarning "jq not found — skipping hooks installation"
    printWarning "Install jq to enable hooks: https://jqlang.github.io/jq/download/"
    echo
    return 0
  }

  command -v bun &>/dev/null || {
    printWarning "bun not found — skipping hooks installation"
    printWarning "Install bun to enable hooks: https://bun.sh"
    echo
    return 0
  }

  # Create hooks directory
  createDirectory "${HOOKS_DIR}" || return 1
  createDirectory "${HOOKS_SCRIPTS_DIR}" || return 1

  # Copy hooks config files (package.json, tsconfig.json, .gitignore, bun.lock)
  copyFileWithConfirmation "${SCRIPT_DIR}/hooks/package.json" "${HOOKS_DIR}/package.json"
  copyFileWithConfirmation "${SCRIPT_DIR}/hooks/tsconfig.json" "${HOOKS_DIR}/tsconfig.json"
  copyFileWithConfirmation "${SCRIPT_DIR}/hooks/.gitignore" "${HOOKS_DIR}/.gitignore"
  copyFileWithConfirmation "${SCRIPT_DIR}/hooks/bun.lock" "${HOOKS_DIR}/bun.lock"

  # Copy hook scripts
  local scriptCount=0
  for scriptFile in "${SCRIPT_DIR}/hooks/scripts"/*.ts; do
    [[ -f "$scriptFile" ]] || continue
    local filename
    filename=$(basename "$scriptFile")
    copyFileWithConfirmation "$scriptFile" "${HOOKS_SCRIPTS_DIR}/${filename}"
    ((scriptCount++))
  done
  printInfo "Copied ${scriptCount} hook scripts"

  # Install bun dependencies
  printInfo "Installing bun dependencies..."
  ( cd "${HOOKS_DIR}" && bun install --silent ) || {
    printError "bun install failed in ${HOOKS_DIR}"
    return 1
  }
  printSuccess "bun dependencies installed"

  # Register hooks in settings.json
  registerHooksInSettings || return 1

  echo
  return 0
}

registerHooksInSettings() {
  local settingsFile="${CLAUDE_DIR}/settings.json"
  local existingSettings="{}"
  [[ -f "$settingsFile" ]] && existingSettings=$(cat "$settingsFile")

  local newHooks
  newHooks=$(cat <<EOF
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        { "type": "command", "command": "bun run \"${HOOKS_SCRIPTS_DIR}/commit-validator.ts\"", "timeout": 15 },
        { "type": "command", "command": "bun run \"${HOOKS_SCRIPTS_DIR}/branch-validator.ts\"", "timeout": 5 },
        { "type": "command", "command": "bun run \"${HOOKS_SCRIPTS_DIR}/pr-validator.ts\"", "timeout": 10 }
      ]
    }
  ],
  "Stop": [
    {
      "hooks": [
        { "type": "command", "command": "bun run \"${HOOKS_SCRIPTS_DIR}/task-checker.ts\"", "timeout": 30 }
      ]
    },
    {
      "hooks": [
        { "type": "command", "command": "bun run \"${HOOKS_SCRIPTS_DIR}/code-guardian.ts\"", "timeout": 60 }
      ]
    }
  ]
}
EOF
)

  # Merge: replace tool-kit-hook entries while preserving other hooks (e.g. cleanClaudePollution)
  echo "$existingSettings" | jq \
    --argjson new "$newHooks" \
    '
    # Remove any existing tool-kit-hooks entries (detect by command containing tool-kit-hooks/scripts)
    .hooks //= {} |
    .hooks.PreToolUse //= [] |
    .hooks.Stop //= [] |
    .hooks.PreToolUse |= map(
      if (.hooks? and (.hooks | type) == "array") then
        .hooks |= map(select(.command // "" | contains("tool-kit-hooks/scripts") | not)) |
        select(.hooks | length > 0)
      else . end
    ) |
    .hooks.Stop |= map(
      if (.hooks? and (.hooks | type) == "array") then
        .hooks |= map(select(.command // "" | contains("tool-kit-hooks/scripts") | not)) |
        select(.hooks | length > 0)
      else . end
    ) |
    # Append new tool-kit-hooks entries
    .hooks.PreToolUse += $new.PreToolUse |
    .hooks.Stop += $new.Stop |
    # Remove legacy plugin registration if present
    if .enabledPlugins? then del(.enabledPlugins["'"${HOOKS_DIR}"'"]) else . end
    ' > "${settingsFile}.tmp" || {
    printError "Failed to update settings.json"
    rm -f "${settingsFile}.tmp"
    return 1
  }

  mv "${settingsFile}.tmp" "$settingsFile"
  printSuccess "Hooks registered in settings.json"
  return 0
}

# -----------------------------------------------------------------------------
# Validation Functions
# -----------------------------------------------------------------------------

validateInstallation() {
  printInfo "Verifying installation..."
  local validationPassed=true

  # Check skills
  local skillCount
  skillCount=$(find "${SKILLS_DIR}" -maxdepth 1 -type d | wc -l)
  ((skillCount--)) # Subtract 1 for the directory itself

  [[ $skillCount -ge 7 ]] && {
    printSuccess "${skillCount} skills installed"
  } || {
    printWarning "Some skills may not have been installed (found ${skillCount})"
  }

  # Check commands
  local cmdCount
  cmdCount=$(find "${COMMANDS_DIR}" -name "*.md" -type f 2>/dev/null | wc -l)

  [[ $cmdCount -ge 5 ]] && {
    printSuccess "${cmdCount} commands installed"
  } || {
    printWarning "Some commands may not have been installed (found ${cmdCount})"
  }

  # Check agents
  local agentCount
  agentCount=$(find "${AGENTS_DIR}" -name "*.md" -type f 2>/dev/null | wc -l)

  [[ $agentCount -ge 7 ]] && {
    printSuccess "${agentCount} agents installed"
  } || {
    printWarning "Some agents may not have been installed (found ${agentCount})"
  }

  # Check hooks
  command -v jq &>/dev/null && command -v bun &>/dev/null && {
    local scriptCount
    scriptCount=$(find "${HOOKS_SCRIPTS_DIR}" -name "*.ts" -type f 2>/dev/null | wc -l)
    [[ $scriptCount -ge 6 ]] && {
      printSuccess "${scriptCount} hook scripts installed"
    } || {
      printWarning "Some hook scripts may not have been installed (found ${scriptCount})"
    }

    [[ -d "${HOOKS_DIR}/node_modules" ]] && {
      printSuccess "Hook dependencies installed"
    } || {
      printWarning "Hook dependencies not installed (node_modules missing)"
    }

    [[ -f "${CLAUDE_DIR}/settings.json" ]] && {
      local hookCount
      hookCount=$(jq '[.hooks.PreToolUse[]?.hooks[]?, .hooks.Stop[]?.hooks[]?] | map(select(.command // "" | contains("tool-kit-hooks/scripts"))) | length' "${CLAUDE_DIR}/settings.json" 2>/dev/null)
      [[ "$hookCount" -ge 5 ]] && {
        printSuccess "${hookCount} hooks registered in settings.json"
      } || {
        printWarning "Hooks not properly registered in settings.json (found ${hookCount})"
      }
    }
  }

  # Check CLAUDE.md
  [[ -f "${CLAUDE_DIR}/CLAUDE.md" ]] && {
    printSuccess "CLAUDE.md installed"
  } || {
    printError "CLAUDE.md installation failed"
    validationPassed=false
  }

  [[ "$validationPassed" == true ]]
}

# -----------------------------------------------------------------------------
# Uninstall Script Creation
# -----------------------------------------------------------------------------

createUninstallScript() {
  local uninstallScript="${CLAUDE_DIR}/uninstall-tool-kit.sh"

  cat > "$uninstallScript" << 'UNINSTALL_SCRIPT'
#!/bin/bash

# Uninstall script for Claude Code Tool Kit

set -euo pipefail

readonly COLOR_RED='\033[0;31m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_RESET='\033[0m'

echo "This will remove the Claude Code Tool Kit."
read -p "Are you sure? (y/N): " -n 1 -r
echo

[[ $REPLY =~ ^[Yy]$ ]] || {
  echo "Uninstall cancelled."
  exit 0
}

# Skills to remove
declare -a skillsToRemove=(
  "backend-architecture"
  "coaching"
  "code-review-pragmatic"
  "code-style"
  "feature-shape"
  "frontend-architecture"
  "git-workflow"
)

# Commands to remove
declare -a commandsToRemove=(
  "coaching.md"
  "planning.md"
  "pragmatic-review.md"
  "ship.md"
  "start.md"
)

# Agents to remove
declare -a agentsToRemove=(
  "coaching-guide.md"
  "coaching-review.md"
  "coaching-scaffold.md"
  "ship-planner.md"
  "ship-progress.md"
  "ship-scanner.md"
  "ship-verifier.md"
)

removedCount=0

for skill in "${skillsToRemove[@]}"; do
  [[ -d "${HOME}/.claude/skills/${skill}" ]] || continue
  rm -rf "${HOME}/.claude/skills/${skill}"
  ((removedCount++))
done

for cmd in "${commandsToRemove[@]}"; do
  [[ -f "${HOME}/.claude/commands/${cmd}" ]] || continue
  rm -f "${HOME}/.claude/commands/${cmd}"
  ((removedCount++))
done

for agent in "${agentsToRemove[@]}"; do
  [[ -f "${HOME}/.claude/agents/${agent}" ]] || continue
  rm -f "${HOME}/.claude/agents/${agent}"
  ((removedCount++))
done

# Remove hooks directory
[[ -d "${HOME}/.claude/tool-kit-hooks" ]] && {
  rm -rf "${HOME}/.claude/tool-kit-hooks"
  echo -e "${COLOR_GREEN}[OK]${COLOR_RESET} Removed hooks directory"
}

# Remove tool-kit hooks from settings.json (keep other hooks intact)
command -v jq &>/dev/null && [[ -f "${HOME}/.claude/settings.json" ]] && {
  jq '
    if .hooks? then
      .hooks.PreToolUse //= [] |
      .hooks.Stop //= [] |
      .hooks.PreToolUse |= map(
        if (.hooks? and (.hooks | type) == "array") then
          .hooks |= map(select(.command // "" | contains("tool-kit-hooks/scripts") | not)) |
          select(.hooks | length > 0)
        else . end
      ) |
      .hooks.Stop |= map(
        if (.hooks? and (.hooks | type) == "array") then
          .hooks |= map(select(.command // "" | contains("tool-kit-hooks/scripts") | not)) |
          select(.hooks | length > 0)
        else . end
      )
    else . end |
    if .enabledPlugins? then del(.enabledPlugins["'"${HOME}"'/.claude/tool-kit-hooks"]) else . end
  ' "${HOME}/.claude/settings.json" > "${HOME}/.claude/settings.json.tmp"
  mv "${HOME}/.claude/settings.json.tmp" "${HOME}/.claude/settings.json"
  echo -e "${COLOR_GREEN}[OK]${COLOR_RESET} Removed tool-kit hooks from settings.json"
}

echo -e "${COLOR_GREEN}Removed ${removedCount} items${COLOR_RESET}"
echo "Claude Code Tool Kit has been uninstalled."
echo "Note: CLAUDE.md was NOT removed (contains your personal config)."

# Self-destruct
rm -f "${BASH_SOURCE[0]}"
UNINSTALL_SCRIPT

  chmod +x "$uninstallScript" && {
    printSuccess "Created uninstall script: ${uninstallScript}"
    return 0
  }

  printWarning "Failed to create uninstall script"
  return 1
}

# -----------------------------------------------------------------------------
# Usage and Messages
# -----------------------------------------------------------------------------

showUsage() {
  cat << EOF
Available commands in Claude Code:
  /start             - Analyze context and propose next action (recommended entry point)
  /coaching          - Start a guided implementation session
  /planning          - Create Implementation Plan from Feature Shape
  /pragmatic-review  - Pragmatic code review
  /ship              - Ship code (scan, plan, verify, commit, push, PR)

Skills are auto-loaded based on context.
EOF
}

showSuccessMessage() {
  echo "============================================="
  echo -e "${COLOR_GREEN}  Installation completed!${COLOR_RESET}"
  echo "============================================="
  echo
  echo "Installed:"
  echo "  - Skills: ${SKILLS_DIR}/"
  echo "  - Commands: ${COMMANDS_DIR}/"
  echo "  - Agents: ${AGENTS_DIR}/"
  echo "  - Hooks: ${HOOKS_DIR}/scripts/ (registered in settings.json)"
  echo "  - Config: ${CLAUDE_DIR}/CLAUDE.md"
  echo
  showUsage

  [[ "$hasWarnings" == true ]] && {
    echo
    printWarning "Some warnings occurred. Check messages above."
  }
}

showFailureMessage() {
  echo "============================================="
  echo -e "${COLOR_RED}  Installation failed!${COLOR_RESET}"
  echo "============================================="
  echo
  echo "Check error messages above."
}

# -----------------------------------------------------------------------------
# Main Installation Flow
# -----------------------------------------------------------------------------

createDirectoryStructure() {
  printInfo "Creating directories..."

  local dirs=("$CLAUDE_DIR" "$SKILLS_DIR" "$COMMANDS_DIR" "$AGENTS_DIR")

  for dir in "${dirs[@]}"; do
    createDirectory "$dir" || return 1
  done

  echo
  return 0
}

main() {
  printHeader

  # Validate source files
  validateSourceFiles || exit 1
  echo

  # Create directory structure
  createDirectoryStructure || exit 1

  # Install components
  installSkills || exit 1
  installCommands || exit 1
  installAgents || exit 1
  installHooks || exit 1
  installClaudeMd || exit 1

  # Validate installation
  validateInstallation || installSuccess=false

  echo

  # Create uninstall script
  createUninstallScript

  echo

  # Show final status
  [[ "$installSuccess" == true ]] && {
    showSuccessMessage
    exit 0
  }

  showFailureMessage
  exit 1
}

# -----------------------------------------------------------------------------
# Script Entry Point
# -----------------------------------------------------------------------------

[[ "${BASH_SOURCE[0]}" == "${0}" ]] && main "$@"
