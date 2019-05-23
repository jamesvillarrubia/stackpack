import { assert } from 'chai';
// import defaultAwesomeFunction, { awesomeFunction } from '../src';
import build from '../lib/cmds/build';

describe('Awesome test.', () => {
  it('should test default awesome function', () => {
    assert(typeof build === 'function');
    assert(true);
  });

  it('should test awesome function', () => {
    assert(true);
  });
});
