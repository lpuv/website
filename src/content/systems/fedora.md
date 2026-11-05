---
title: Fedora packaging
designation: Open source
summary: Fedora packaging and infrastructure. 86box, a few Rust packages, and makedeb.
role: Volunteer & Packager
period: "Dec 2021 — present"
status: ongoing
stack: [Fedora, Ansible, Kubernetes, OpenShift]
order: 32
featured: false
---

## What it is

I work on Fedora packaging and Fedora Infrastructure. The packaging side is the part people see: getting a tool into the repositories so it is installable instead of a build-from-source project with a README.

I package 86box and a few other emulators, some Rust packages, and I work on makedeb. The infrastructure side is Ansible, tickets, and the project's servers. Some of that runs on Kubernetes and OpenShift.

## What's hard

Packaging is a review process, not a build command. The spec has to be correct, the licenses have to be right, the dependencies have to be declared, and someone else has to be able to reproduce the result. A package that builds on your machine is not done.
