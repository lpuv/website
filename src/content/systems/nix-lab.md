---
title: nix-lab
designation: Homelab
summary: One Proxmox host, twelve NixOS LXC containers, one flake.
role: Solo
period: 2024 — present
status: operational
stack: [NixOS, Nix flakes, Proxmox, LXC]
repo: https://github.com/lpuv/nix-lab
order: 10
featured: true
---

## The problem

My homelab worked, and nobody could rebuild it. Services were installed by hand, config drifted, and the only record of how anything worked was my memory and some half-written notes. Every rebuild was archaeology.

I wanted each machine to be a file.

## What it is

The homelab is one Proxmox host called `pinwheel`. It runs twelve NixOS LXC containers: `ipa`, `panel`, `dns`, `media`, `cfproxy`, `trilium`, `finance`, `twitch-miner`, `changes`, `timeline`, `home`, and `monitor`. They all live under `*.internal.craftcat.dev`.

Proxmox does the machine, the storage, and the snapshots. NixOS does the config inside each container. The flake is the source of truth for the containers; the host stays boring.

The host is a SER8: Ryzen 7 8745HS, 27 GiB of RAM, a 414 GiB ext4 root, and a 2.32 TiB ZFS pool. Enough to run everything without making the homelab a second job.

## What was hard

**The boundary.** A container is not a VM, so the networking is different, the isolation is different, and a bad bind mount can make the host's problem the container's problem.

**Secrets.** Anything secret can't live in the flake, but anything outside the flake breaks the one-source-of-truth property. I still haven't found a version of that I love.

**Bootstrapping.** Declarative config assumes a machine that can already evaluate it. Getting from bare metal to the first generation is the one step that isn't reproducible.

## What I'd change

I'd start with impermanence on day one. Retrofitting it is worse.
