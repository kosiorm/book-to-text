#!/bin/bash

# Function to handle errors
handle_error() {
    case $1 in
        20) echo "Error occurred while updating package lists.";;
        22) echo "Error occurred while installing FFmpeg.";;
        25) echo "Error occurred while installing Node.js and npm using NVM.";;
        28) echo "Error occurred while sourcing ~/.bashrc.";;
        29) echo "Error occurred while installing Node.js version 16.20.2.";;
        32) echo "Error occurred while installing Git.";;
        34) echo "Error occurred while cloning the repository.";;
        36) echo "Error occurred while navigating to the project directory.";;
        38) echo "Error occurred while installing project dependencies.";;
        41) echo "Error occurred while installing Conda.";;
        43) echo "Error occurred while running the Miniconda installation script.";;
        45) echo "Error occurred while removing the Miniconda installation script.";;
        48) echo "Error occurred while adding Conda to PATH.";;
        50) echo "Error occurred while sourcing ~/.bashrc.";;
        52) echo "Error occurred while updating Conda.";;
        54) echo "Error occurred while creating a Python 3.10 environment.";;
        56) echo "Error occurred while activating the Python environment.";;
        58) echo "Error occurred while installing PyTorch 2.0 and Torchaudio 2.0.";;
        60) echo "Error occurred while installing whisperx.";;
        *) echo "An unknown error occurred.";;
    esac
    echo "Line $1 exited with status: $2"
    exit $2
}

# Trap ERR signal and call our error handler
trap 'handle_error $LINENO $?' ERR

# Update package lists
sudo apt-get update || exit 1

# Install FFmpeg
sudo apt-get install ffmpeg -y || exit 1

# Install curl
sudo apt-get install curl -y || exit 1

# Install Node.js and npm using NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash || exit 1
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
nvm install 16.20.2 || exit 1

# Install Git
sudo apt-get install git -y || exit 1

# Clone your repository
git clone https://github.com/ator88/book-to-text.git || exit 1

# Navigate to your project directory
cd book-to-text || exit 1

# Install your project's dependencies
npm install || exit 1

sudo apt-get update -y || exit 1
sudo apt-get install -y wine || exit 1

# Install Conda
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh || exit 1
bash Miniconda3-latest-Linux-x86_64.sh -b -f -p $HOME/miniconda || exit 1
rm Miniconda3-latest-Linux-x86_64.sh || exit 1

# Add Conda to PATH
echo 'export PATH="$HOME/miniconda/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc || exit 1

conda update -n base -c defaults conda -y || exit 1

# Create a Python 3.10 environment
conda create -n btt python=3.10 -y || exit 1

# Activate the Python environment
conda activate btt || exit 1

# Install PyTorch 2.0, Torchaudio 2.0 and PyTorch CUDA 11.8
conda install pytorch==2.0.0 torchaudio==2.0.0 pytorch-cuda=11.8 -c pytorch -c nvidia || exit 1

# Install whisperx
pip install git+https://github.com/m-bain/whisperx.git || exit 1

# Replace yourusername and yourrepository with your actual GitHub username and repository name.