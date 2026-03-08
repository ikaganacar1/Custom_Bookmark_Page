FROM python:3.11-slim

WORKDIR /app

# Download Nerd Fonts Symbols Only (icon font, ~1MB)
RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/* && \
    curl -fsSL "https://github.com/ryanoasis/nerd-fonts/releases/download/v3.3.0/NerdFontsSymbolsOnly.zip" \
        -o /tmp/nf.zip && \
    mkdir -p static/fonts && \
    unzip -j /tmp/nf.zip "SymbolsNerdFont-Regular.ttf" -d static/fonts/ && \
    rm /tmp/nf.zip && \
    apt-get purge -y curl unzip && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

RUN pip install flask

COPY app.py .
COPY static/ static/
RUN mkdir -p data

EXPOSE 5000

CMD ["python", "app.py"]
