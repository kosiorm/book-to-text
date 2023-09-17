#!/bin/bash

handle_error() {
  case $1 in
    10) echo "Error occurred while updating package lists.";;
    20) echo "Error occurred while installing FFmpeg.";;
    30) echo "Error occurred while installing curl.";;
    40) echo "Error occurred while installing project dependencies.";;
    50) echo "Error occurred while downloading the Miniconda installation script.";;
    60) echo "Error occurred while running the Miniconda installation script.";;
    70) echo "Error occurred while removing the Miniconda installation script.";;
    80) echo "Error occurred while adding Conda to PATH.";;
    90) echo "Error occurred while activating the Conda base environment.";;
    100) echo "Error occurred while updating Conda.";;
    110) echo "Error occurred while creating a Python 3.10 environment.";;
    120) echo "Error occurred while activating the Python environment.";;
    130) echo "Error occurred while installing PyTorch 2.0, Torchaudio 2.0, and PyTorch CUDA 11.8.";;
    140) echo "Error occurred while installing whisperx.";;
    150) echo "Error occurred while installing Node.js and npm.";;
    160) echo "Error occurred while installing Wine.";;
    *) echo "An unknown error occurred.";;
  esac
  exit $1
}


dpkg --add-architecture i386 || handle_error 170

apt-get update || handle_error 10

apt-get install -y wine32 || handle_error 180

apt-get update || handle_error 10

apt-get install -y ffmpeg || handle_error 20

apt-get install -y curl || handle_error 30

apt-get install -y libatk1.0-0

apt-get install -y libnss3

apt-get install -y libatk-bridge2.0-0

apt-get install -y libcups2

apt-get install -y libxcomposite1

apt-get install -y libxdamage1

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash || handle_error 150

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install --lts || handle_error 150

npm install || handle_error 40

wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh || handle_error 50

bash Miniconda3-latest-Linux-x86_64.sh -b -u -p $HOME/miniconda || handle_error 60

rm Miniconda3-latest-Linux-x86_64.sh || handle_error 70

echo 'export PATH="$HOME/miniconda/bin:$PATH"' >> ~/.bashrc
. ~/.bashrc || handle_error 80

source $HOME/miniconda/bin/activate || handle_error 90

conda update -n base -c defaults conda -y || handle_error 100

conda create -n btt python=3.10 -y || handle_error 110

conda activate btt || handle_error 120

conda install -c pytorch -c nvidia pytorch=2.0.0 torchaudio=2.0.0 torchvision -y || handle_error 130

pip install git+https://github.com/m-bain/whisperx.git || handle_error 140