import { spawnSync } from 'node:child_process';
import { mkdtemp, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root=process.cwd();
const api=resolve(root,'app/api');
let backup;
if(process.env.GITHUB_ACTIONS==='true'){
  backup=await mkdtemp(join(tmpdir(),'hailmary-static-api-'));
  await rename(api,join(backup,'api'));
}
try{
  const nextBin=resolve(root,'node_modules/next/dist/bin/next');
  const result=spawnSync(process.execPath,[nextBin,'build'],{cwd:root,env:process.env,stdio:'inherit'});
  if(result.error)throw result.error;
  process.exitCode=result.status??1;
}finally{
  if(backup){await rename(join(backup,'api'),api);await rm(backup,{recursive:true,force:true});}
}
