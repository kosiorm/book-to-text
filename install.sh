#!/bin/bash

handle_error() {
  case $1 in
    20) echo "Error occurred while updating package lists.";;
    22) echo "Error occurred while installing FFmpeg.";;
    18) echo "Error occurred while installing curl.";;
    38) echo "Error occurred while installing project dependencies.";;
    41) echo "Error occurred while downloading the Miniconda installation script.";;
    43) echo "Error occurred while running the Miniconda installation script.";;
    45) echo "Error occurred while removing the Miniconda installation script.";;
    48) echo "Error occurred while adding Conda to PATH.";;
    50) echo "Error occurred while activating the Conda base environment.";;
    52) echo "Error occurred while updating Conda.";;
    54) echo "Error occurred while creating a Python 3.10 environment.";;
    56) echo "Error occurred while activating the Python environment.";;
    58) echo "Error occurred while installing PyTorch 2.0, Torchaudio 2.0, and PyTorch CUDA 11.8.";;
    60) echo "Error occurred while installing whisperx.";;
    61) echo "Error occurred while installing Node.js and npm.";;
    62) echo "Error occurred while installing libatk1.0-0.";;
    63) echo "Error occurred while installing libnss3.";;
    64) echo "Error occurred while installing libatk-bridge2.0-0.";;
    65) echo "Error occurred while installing libcups2.";;
    66) echo "Error occurred while installing libxcomposite1.";;
    67) echo "Error occurred while installing libxdamage1.";;
    68) echo "Error occurred while installing wine.";;
  esac
  exit $1
}
sudo dpkg --add-architecture i386 || handle_error 170

sudo apt-get update || handle_error 20

sudo apt-get install -y wine64 || handle_error 180

sudo apt-get update || handle_error 20

sudo apt-get install -y ffmpeg || handle_error 22

sudo apt-get install -y curl || handle_error 18

sudo apt-get install -y libatk1.0-0 || handle_error 62

sudo apt-get install -y libnss3 || handle_error 63

sudo apt-get install -y libatk-bridge2.0-0 || handle_error 64

sudo apt-get install -y libcups2 || handle_error 65

sudo apt-get install -y libxcomposite1 || handle_error 66

sudo apt-get install -y libxdamage1 || handle_error 67

sudo apt-get install -y wine || handle_error 68

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash || handle_error 61

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install --lts || handle_error 61

npm install || handle_error 38

wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh || handle_error 41

bash Miniconda3-latest-Linux-x86_64.sh -b -u -p $HOME/miniconda || handle_error 43

rm Miniconda3-latest-Linux-x86_64.sh || handle_error 45

echo 'export PATH="$HOME/miniconda/bin:$PATH"' >> ~/.bashrc
. ~/.bashrc || handle_error 48

source $HOME/miniconda/bin/activate || handle_error 50

conda update -n base -c defaults conda -y || handle_error 52

conda create -n btt python=3.10 -y || handle_error 54

conda activate btt || handle_error 56

conda install -c pytorch -c nvidia pytorch=2.0.0 torchaudio=2.0.0 torchvision -y || handle_error 58

pip install git+https://github.com/m-bain/whisperx.git || handle_error 60