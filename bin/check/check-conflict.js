// check if have conflict
const chalk = require('chalk');
const shell = require('shelljs');

const cmd = {
  local: 'git --no-pager diff --cached --check',
  ci: 'git --no-pager diff --check',
};

const main = () => {
  console.log('conflict check start');
  const start = Date.now();
  // judge enviroment
  const path = process.argv.slice(2);
  const isLocal = path.length === 0;
  const command = isLocal ? cmd.local : `${cmd.ci} ${path.join(' ')}`;
  // check unstage file marks
  const check = shell.exec(command, {
    encoding: 'utf8',
    silent: true,
  });
  // trim blank
  const reg = /^\+|trailing whitespace\.$|new blank line at EOF.$/;
  const res = check.stdout
    .split('\n')
    .filter((v) => {
      return !v.match(reg);
    })
    .filter((v) => v);

  const count = Math.floor(res.length / 3);
  if (count !== 0) {
    console.warn(chalk.yellow(res.join('\n')));
    console.warn(chalk.yellow(`${count} unresolve conflicts`));
    process.exitCode = 1;
  }
  console.log('conflict check end:', `${Date.now() - start}ms`);
};

main();
