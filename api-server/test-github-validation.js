// Test script to validate GitHub repository validation
const { validateGitHubRepo } = require('./utils/github-validator')

async function testGitHubValidation() {
    console.log('🧪 Testing GitHub repository validation...\n')

    const testRepos = [
        'https://github.com/facebook/react',           // Should exist
        'https://github.com/nonexistent/repo123456',   // Should not exist
        'https://github.com/KDeepak5673/DEMO2',        // The specific repo mentioned
        'invalid-url',                                 // Invalid format
        'https://github.com/microsoft/vscode',         // Should exist
    ]

    for (const repo of testRepos) {
        try {
            console.log(`Testing: ${repo}`)

            // Extract owner and repo from GitHub URL
            const gitUrlMatch = repo.match(/github\.com\/([^\/]+)\/([^\/]+)/)
            if (!gitUrlMatch) {
                console.log(`❌ Invalid GitHub repository URL format`)
                console.log('---')
                continue
            }

            const [, owner, repoName] = gitUrlMatch
            const cleanRepo = repoName.replace(/\.git$/, '') // Remove .git if present

            // Check if repository exists using GitHub API
            const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`)

            if (response.status === 404) {
                console.log(`❌ Repository '${owner}/${cleanRepo}' does not exist or is private`)
            } else if (response.ok) {
                const data = await response.json()
                console.log(`✅ Repository '${owner}/${cleanRepo}' exists`)
                console.log(`   - Stars: ${data.stargazers_count}`)
                console.log(`   - Language: ${data.language || 'N/A'}`)
                console.log(`   - Private: ${data.private}`)
            } else {
                console.log(`⚠️  GitHub API returned status ${response.status}`)
            }

        } catch (error) {
            console.log(`❌ Error: ${error.message}`)
        }

        console.log('---')
    }
}

if (require.main === module) {
    testGitHubValidation()
}