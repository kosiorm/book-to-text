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
        # Add more error messages as needed
    esac
    exit $1
}

# Update package lists
sudo apt-get update || handle_error 20

# Install FFmpeg
sudo apt-get install -y ffmpeg || handle_error 22

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash || exit 1
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
nvm install 16.20.2 || exit 1

# Install Git
sudo apt-get install -y git || handle_error 32

# Clone the repository
git clone https://github.com/ator88/book-to-text.git || handle_error 34

# Navigate to the project directory
cd book-to-text || handle_error 36

# Install project dependencies
npm install || handle_error 38

# Download the Miniconda installation script
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh || handle_error 41

# Run the Miniconda installation script
bash Miniconda3-latest-Linux-x86_64.sh -b -u -p $HOME/miniconda || handle_error 43

# Remove the Miniconda installation script
rm Miniconda3-latest-Linux-x86_64.sh || handle_error 45

# Add Conda to PATH
echo 'export PATH="$HOME/miniconda/bin:$PATH"' >> ~/.bashrc
. ~/.bashrc || handle_error 48

# Activate the Conda base environment
source $HOME/miniconda/bin/activate || handle_error 50

# Update Conda
conda update -n base -c defaults conda -y || handle_error 52

# Create a Python 3.10 environment
conda create -n btt python=3.10 -y || handle_error 54

# Activate the Python environment
conda activate btt || handle_error 56

# Install PyTorch 2.0, Torchaudio 2.0 and PyTorch CUDA 11.8
conda install pytorch==2.0.0 torchaudio==2.0.0 pytorch-cuda=11.8 -c pytorch -c nvidia || handle_error 58

# Install whisperx
pip install git+https://github.com/m-bain/whisperx.git || handle_error 60

