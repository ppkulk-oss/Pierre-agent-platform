# GitHub Setup Script for Agent Platform
# Run these commands to push to GitHub and deploy to Streamlit Cloud

# Step 1: Create .gitignore
cat > .gitignore << 'EOF'
# Credentials and sensitive files
credentials/
.env
.env.local
*.key
*.pem

# Node modules
node_modules/

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info/
dist/
build/

# Logs
logs/
*.log

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Large files
*.jpg
*.png
*.gif
*.mp4
*.pdf

# But keep structure
!memory/.gitkeep
!logs/.gitkeep
EOF

# Step 2: Configure git (if not already)
git config user.email "pierre@openclaw.ai" 2>/dev/null || true
git config user.name "Pierre" 2>/dev/null || true

# Step 3: Add files
git add .

# Step 4: Commit
git commit -m "Initial commit: Agent platform with Japan dashboard

- Multi-agent system (Allemand, Odyssey)
- Japan trip dashboard (Streamlit)
- Wine allocation tracking
- Architecture docs
"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ LOCAL COMMIT COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo ""
echo "1. Create a GitHub repository:"
echo "   - Go to https://github.com/new"
echo "   - Name it: agent-platform (or whatever you want)"
echo "   - Make it private (recommended)"
echo "   - Don't initialize with README (we have one)"
echo ""
echo "2. Connect and push:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/agent-platform.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Deploy to Streamlit Cloud:"
echo "   - Go to https://share.streamlit.io"
echo "   - Sign in with GitHub"
echo "   - Click 'New app'"
echo "   - Select your repo"
echo "   - Set main file path: scripts/japan-dashboard.py"
echo "   - Click Deploy!"
echo ""
echo "Your dashboard will be live at:"
echo "   https://your-app-name.streamlit.app"
echo ""
echo "═══════════════════════════════════════════════════════════════"
