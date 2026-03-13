FROM ruby:3.3-slim

# System dependencies
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev \
      libyaml-dev \
      nodejs \
      npm \
      curl \
      git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
