
var cxVersion = {
    respondToSel: function(sel) {
        try {
            if (typeof sel==="string" && sel.length>0) {
                return eval('!!'+ sel);
            }
            return false;
        }
        catch(err) {
            return false;
        }
    }
};
