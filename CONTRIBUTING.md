# Contributing

Contributions are accepted under the [GNU Affero General Public License, version 3 only](LICENSE) and the [Developer Certificate of Origin 1.1](https://developercertificate.org). Sign off every commit:

```shell
git commit -s
```

Every commit needs a `Signed-off-by` line; `git rebase --signoff main` adds missing ones. You keep your copyright; your contribution carries this repository's license.

The icons in `public/` are not contributed to or licensed for reuse; see [public/NOTICE.md](public/NOTICE.md).

Before a pull request:

```shell
npm run tsc && npm test && npm run build
```
