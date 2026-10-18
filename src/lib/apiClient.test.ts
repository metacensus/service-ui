import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";


const fetchMock = vi.fn<typeof fetch>();
/** mock for calls to `location.assign()` */
const assign = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  assign.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("window", { location: { pathname: "/topics", assign } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});



  });


    expect(assign).not.toHaveBeenCalled();
  });
    expect(assign).not.toHaveBeenCalled();

    expect(assign).not.toHaveBeenCalled();
  });
    expect(assign).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });
});



  });
});



  });



  });

    fetchMock.mockResolvedValue(new Response("", { status: 401 }));

    );
  });
});

  });


