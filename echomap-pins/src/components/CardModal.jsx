import { Share2, X, BookOpen, Mic, MapPin, ExternalLink } from "lucide-react";

export default function CardModal({ card, onClose }) {
  if (!card) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: card.title,
          text: `我在 EchoMap Pins 给你留下了一个地点故事：${card.title}\n"${card.story}"`,
          url: window.location.href,
        });
      } catch (err) { console.log("Share failed", err); }
    } else {
      alert("当前浏览器不支持原生分享，请复制链接。");
    }
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{card.title}</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn--ghost" onClick={handleShare}>
              <Share2 size={20} />
            </button>
            <button className="btn btn--ghost" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal__body">
          {card.photo && (
            <div className="modal__photo">
              <img src={card.photo} alt={card.title} />
            </div>
          )}

          <div className="modal__section">
            <h3><BookOpen size={18} className="inline-block mr-2" /> Story</h3>
            <p className="modal__text">{card.story}</p>
          </div>

          {card.audio && (
            <div className="modal__section">
              <h3><Mic size={18} className="inline-block mr-2" /> 语音评价</h3>
              <audio 
                controls 
                src={card.audio} 
                style={{ 
                  width: "100%",
                  borderRadius: "8px",
                  outline: "none"
                }} 
              />
              <p className="hint" style={{ marginTop: "8px" }}>
                点击播放按钮收听语音
              </p>
            </div>
          )}

          {card.location && (
            <div className="modal__section">
              <h3><MapPin size={18} className="inline-block mr-2" /> Location</h3>
              <p className="modal__text">
                Lat: {card.location.lat.toFixed(6)}, Lng: {card.location.lng.toFixed(6)}
                <br />
                <span className="hint">Accuracy: ±{Math.round(card.location.accuracy)}m</span>
              </p>
              <a
                href={`https://www.google.com/maps?q=${card.location.lat},${card.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary"
                style={{ 
                  display: 'inline-block', 
                  textDecoration: 'none',
                  marginTop: '8px',
                  textAlign: 'center'
                }}
              >
                <ExternalLink size={18} className="inline-block mr-2" /> 在 Google Maps 中查看
              </a>
            </div>
          )}

          <div className="modal__section">
            <p className="card__meta">
              Created: {new Date(card.createdAt).toLocaleString()}
            </p>
            {card.updatedAt !== card.createdAt && (
              <p className="card__meta">
                Updated: {new Date(card.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
