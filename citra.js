(function(){

this.CV = null;

(function(){
    CV = function(images, callback, canvas){
        CV.files = images;
        var canvas = $(canvas) || $(canvas) || document.createElement('canvas');
        var ctx = canvas.getContext('2d')
        CV.context = ctx
        CV.images = {}
        for(i in images){
            $.load(images[i],function(e){
                var _i = e.target;
                canvas.width = _i.width;
                canvas.height = _i.height;
                ctx.drawImage(_i,0,0);
                CV.images[i] = {};
                CV.images[i] = ctx.getImageData(0,0,canvas.width,canvas.height);
                if(CV.images.length == images.length){
                    callback();
                }
            })
        }
    }
}());

CV.version = "1.0"

function $(id){return document.getElementById(id)}

$.load = function(url, callback)
{
    var img = new Image();
    img.onload = callback;
    img.src = url;
}

CV.transform = {
    //inplace grey
    grey:function(imd){
        for(y=0; y<imd.height; ++y){
            for(x=0; x<imd.width; ++x){
                p = (y*imd.width+x)*4;
                r = imd.data[p]
                g = imd.data[p+1]
                b = imd.data[p+2]
                gv = (.299 * r+ .587 * g+.114 * b)
                imd.data[p] = gv;
                imd.data[p+1] = gv;
                imd.data[p+2] = gv;
            }
        }
    },
    //inplace threshold
    treshold:function(imd, tvalue, range){
        tvalue = tvalue || 128;
        range = range || [0,255]
        for(y=0; y<imd.height; ++y){
            for(x=0; x<imd.width; ++x){
                p = (y*imd.width+x)*4;
                r = imd.data[p]
                g = imd.data[p+1]
                b = imd.data[p+2]
                gv = (.299 * r+ .587 * g+.114 * b)>tvalue?range[1]:range[0];
                imd.data[p] = gv;
                imd.data[p+1] = gv;
                imd.data[p+2] = gv;
            }
        }
    },
    scale:function(imd,newid,newwidth,newheight){
        var nctx = document.createElement('canvas').getContext('2d')
        
        CV.display(imd);
        var cvs = nctx.canvas;
        cvs.width = newwidth;
        cvs.height = newheight;
        nctx.drawImage(CV.context.canvas,0,0,newwidth,newheight);
        CV.images[newid] = nctx.getImageData(0,0,newwidth,newheight);
        
        return CV.images[newid];
    },
    rotate:function(imd,newid,angle,cx,cy){
        try{
        var cx = cx || imd.width / 2;
        var cy = cy || imd.height / 2;
        
        var nctx = document.createElement('canvas').getContext('2d')
        
        CV.display(imd);
        var cvs = nctx.canvas;
        var sv = Math.sin(angle);
        var cv = Math.cos(angle);
        cvs.width = imd.width * cv + imd.height * sv;
        cvs.height = imd.width * sv + imd.height * cv;
        nctx.translate(cx*cv+cy*sv,cy*cv+cx*sv);
        nctx.rotate(angle);
        nctx.drawImage(CV.context.canvas,-imd.width/2,-imd.height/2,imd.width,imd.height);
        CV.images[newid] = nctx.getImageData(0,0,cvs.width,cvs.height);
        
        return CV.images[newid];
        }catch(e){alert(e)}
    }
}

CV.clear = function(clearColor){
    CV.context.fillStyle = clearColor || "#000";
    CV.context.fillRect(0,0,CV.context.canvas.width,CV.context.canvas.height);
}

CV.display = function(image,context){
    context = context || CV.context;
    if(context.canvas.width != image.width || context.canvas.height != image.height){
        context.canvas.width = image.width;
        context.canvas.height = image.height;
    }
    context.putImageData(image,0,0);
}

CV.create = function(id,width,height){
    CV.images[id] = CV.context.createImageData(width,height);
};

CV.clone = function(oldid,newid){
    var c = CV.context;
    c.width = CV.images[oldid].width;
    c.height = CV.images[oldid].height;
    c.putImageData(CV.images[oldid],0,0);
    CV.images[newid] = c.getImageData(0,0,c.width,c.height);
};

}());